"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getContactsApi,
  hasContactsApi,
  isAndroid,
  isChrome,
  isSamsungInternet,
  subscribeNoop,
  type ContactsApi,
} from "@/lib/workshop/contacts-api";
import { parseContactText, type ParsedContact } from "@/lib/workshop/vcard";

type ContactImportProps = {
  onImport: (contact: ParsedContact) => void;
};

/** What we would like, in the order we would like it. */
const WANTED = ["name", "tel", "email"] as const;

/**
 * `File.text()` rejects on some Android content providers. FileReader goes
 * through a different path and tends to succeed where it doesn't.
 */
function readFileText(file: File): Promise<string> {
  return file.text().catch(
    () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("read failed"));
        reader.readAsText(file);
      }),
  );
}

/** The address to read out, without the scheme. */
function joinHost(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.host}${window.location.pathname === "/" ? "" : window.location.pathname}`;
}

/**
 * Three ways in, because the platforms are not equal.
 *
 * Android Chrome has the Contact Picker API outright. Safari has it too, but
 * only once a flag is switched on in Settings, so it appears for some iPhones
 * and not others — which is why that is a feature test rather than a check of
 * the platform.
 *
 * Samsung Internet has neither: no picker, no setting that adds one, and
 * sharing a contact into a file input hands back an empty stub named after the
 * contact's row id. Pasting is what is left, and it is the one route that
 * needs nothing of the browser beyond a clipboard — which is also why it
 * carries the iPhones whose owners never found the flag.
 *
 * The contact-card route stays off Android entirely. There it leads into a
 * chooser offering the camera and a file browser, and a contact shared through
 * those arrives empty; on iOS the same route is the Save to Files path, which
 * works, so it stays.
 */
export function ContactImport({ onImport }: ContactImportProps) {
  const hasPicker = useSyncExternalStore(subscribeNoop, hasContactsApi, () => false);
  // ?diag=1 reports what this handset actually offers, so a device we can't
  // test here can tell us itself rather than us inferring from the symptom.
  const showDiagnostics = useSyncExternalStore(
    subscribeNoop,
    () => new URLSearchParams(window.location.search).has("diag"),
    () => false,
  );
  const android = useSyncExternalStore(subscribeNoop, isAndroid, () => false);
  const samsung = useSyncExternalStore(subscribeNoop, isSamsungInternet, () => false);
  const chrome = useSyncExternalStore(subscribeNoop, isChrome, () => false);
  const [reported, setReported] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // null means the paste box is closed. A string, including an empty one,
  // means it is open and holding that.
  const [draft, setDraft] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  // Which properties this browser will actually return. Safari's
  // implementation supports fewer than Chrome's, and asking for one it does
  // not know about makes select() reject outright.
  const supported = useRef<string[]>([...WANTED]);

  useEffect(() => {
    if (!hasPicker) return;
    let cancelled = false;

    void (async () => {
      try {
        const props = await getContactsApi()?.getProperties?.();
        if (cancelled) return;
        if (Array.isArray(props) && props.length > 0) {
          supported.current = props;
          setReported(props.join(", "));
        } else {
          setReported("getProperties() returned nothing");
        }
      } catch (error) {
        // Keep the defaults; select() will tell us if they're wrong.
        setReported(`getProperties() failed: ${String(error)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasPicker]);

  /** Fill the form from whatever text we were handed. */
  function apply(text: string): boolean {
    const parsed = parseContactText(text);
    if (!parsed) return false;
    onImport(parsed);
    setNote(null);
    setDraft(null);
    return true;
  }

  async function pickFromPhone() {
    const api = getContactsApi();
    if (!api) {
      setNote("This browser won't open your contacts. Paste them instead, or type below.");
      return;
    }

    // Resolved from a cached list rather than awaiting getProperties() here:
    // an await before select() breaks the user-gesture chain the picker needs.
    const props = WANTED.filter((p) => supported.current.includes(p));
    if (props.length === 0) props.push("name");

    // Asking for a property a browser doesn't know makes select() reject
    // outright, so narrow and try again. A long shot rather than a fix: the
    // picker needs user activation and the first call has already spent it,
    // so a retry usually fails too. getProperties() above is what actually
    // keeps us out of this, and this is only here for the phone it misses.
    const attempts = [props, ["name", "tel"], ["name"]];

    try {
      let results: Awaited<ReturnType<ContactsApi["select"]>> | null = null;
      let lastError: unknown = null;

      for (const attempt of attempts) {
        try {
          results = await api.select(attempt, { multiple: false });
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!results) throw lastError ?? new Error("select() failed");

      const first = results[0];
      // An empty result means they backed out, which is not an error.
      if (!first) return;
      onImport({
        name: first.name?.[0] ?? "",
        company: "",
        phone: first.tel?.[0] ?? "",
        email: first.email?.[0] ?? "",
      });
      setNote(null);
    } catch (error) {
      console.error("Contact picker failed", error);
      setNote("Couldn't open your contacts. Paste their details instead, or type them below.");
    }
  }

  /**
   * Read the clipboard if the browser will allow it, and open the box if not.
   * Reading needs permission the first time and the prompt only appears off a
   * tap, so this runs straight off the button with no await before it.
   */
  async function pasteContact() {
    let clipboard = "";
    try {
      clipboard = (await navigator.clipboard?.readText()) ?? "";
    } catch {
      // Denied, or this browser only hands over the clipboard on a real paste
      // gesture. Either way the box below is the way in.
    }

    if (clipboard.trim() && apply(clipboard)) return;

    setDraft(clipboard);
    setNote(
      clipboard.trim()
        ? "Couldn't find a name or number in what you copied. Have a look below."
        : null,
    );
    requestAnimationFrame(() => boxRef.current?.focus());
  }

  async function readVCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    // Named in the message because "couldn't read that file" with no idea
    // which file sent us round in circles for a week.
    const what = `${file.name || "that file"} (${file.type || "no type"}, ${file.size} bytes)`;

    // Sharing a contact out of a phone's Contacts app into a file input hands
    // over an empty stub named after the contact's row id. There is nothing to
    // read and no amount of retrying will produce one, so say so plainly
    // rather than making it look like a failure they can fix by trying again.
    if (file.size === 0) {
      setNote(
        "Your phone handed over an empty file, which is what it does when sharing a contact straight into a browser. Copy their details and use Paste a contact instead, or type the name below.",
      );
      return;
    }

    try {
      if (apply(await readFileText(file))) return;
      setNote(
        `${what} isn't a contact card. Share the person from your Contacts app and save it as a .vcf first — or just type the name below.`,
      );
    } catch (error) {
      console.error("Contact card read failed", error);
      setNote(`Couldn't open ${what}. Type the details below instead.`);
    }
  }

  return (
    <div className="space-y-2">
      {hasPicker ? (
        <button type="button" onClick={pickFromPhone} className="workshop-import">
          Choose from my contacts
        </button>
      ) : (
        <button type="button" onClick={pasteContact} className="workshop-import">
          Paste a contact
        </button>
      )}

      {draft !== null ? (
        <div className="rounded-xl border-[1.5px] border-border bg-white p-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-foreground">
              Paste their details here
            </span>
            <textarea
              ref={boxRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder={"Harry Smith\nSmith Joinery\n07700 900123"}
              className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!apply(draft)) {
                  setNote("Couldn't find a name or number in that. Type the details in below.");
                }
              }}
              className="flex-1 rounded-xl bg-bni px-3 py-2.5 text-sm font-bold text-white"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setNote(null);
              }}
              className="rounded-xl border-[1.5px] border-border px-3 py-2.5 text-sm font-bold text-foreground"
            >
              Cancel
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            A whole contact card, a couple of lines, or just a name and a number — it will
            pull out what it can.
          </p>
        </div>
      ) : null}

      {/*
        A label wrapping a visually hidden input, rather than display:none plus
        a programmatic click. A file input hidden with display:none is skipped
        by some mobile browsers, so the chooser either never opened or never
        returned the file.

        Android is excluded above the button, not filtered here: there is no
        `accept` value that makes that chooser hand back a readable contact.
      */}
      {android ? null : (
        <label className="workshop-import is-secondary">
          <input type="file" accept=".vcf,text/vcard" onChange={readVCard} className="sr-only" />
          {hasPicker ? "Or use a contact card" : "Or use a contact card (.vcf)"}
        </label>
      )}

      {showDiagnostics ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
          Picker: {hasPicker ? "available" : "not available"}
          <br />
          Clipboard read:{" "}
          {typeof navigator === "undefined"
            ? "—"
            : typeof navigator.clipboard?.readText === "function"
              ? "yes"
              : "no"}
          <br />
          Fields: {reported ?? (hasPicker ? "checking…" : "—")}
          <br />
          UA: {typeof navigator === "undefined" ? "—" : navigator.userAgent}
        </p>
      ) : null}

      {/* Telling a Chrome user to open Chrome is the fastest way to lose them,
          so the nudge only appears for the browsers that actually lack it. */}
      {!hasPicker && android && !chrome ? (
        <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs leading-relaxed text-foreground">
          <strong className="font-bold">
            {samsung ? "Samsung Internet" : "This browser"} can&apos;t open your contacts
            directly.
          </strong>{" "}
          In your Contacts app, open the person and copy or share their details, then come
          back and tap <span className="font-semibold">Paste a contact</span>. For one tap,
          open <span className="font-semibold">{joinHost()}</span> in Chrome instead.
        </p>
      ) : null}

      {note ? (
        <p className="text-xs font-semibold leading-relaxed text-bni">{note}</p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-muted">
          Typing their name is usually quickest.
        </p>
      )}
    </div>
  );
}
