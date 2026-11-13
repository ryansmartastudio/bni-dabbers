"use client";

import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { markInvited, saveContactEdits } from "@/actions/workshop-portal";
import type { WorkshopConstants } from "@/lib/workshop/config";
import type { PortalContact } from "@/lib/workshop/portal";
import { normaliseText } from "@/lib/workshop/normalise";
import {
  formatCount,
  formatMoney,
  projectMemberValue,
  projectNetwork,
} from "@/lib/workshop/projections";
import {
  INVITE_TIPS,
  MESSAGE_TEMPLATES,
  PODCASTS,
  type MessageTemplate,
} from "@/lib/workshop/toolkit";

type Tab = "details" | "messages" | "tips";

export function ContactSheet({
  contact,
  me,
  password,
  sessionId,
  constants,
  meetingLabel,
  reduced,
  onClose,
  onChanged,
}: {
  contact: PortalContact;
  me: string;
  password: string;
  sessionId: string | null;
  constants: WorkshopConstants;
  meetingLabel: string;
  reduced: boolean;
  onClose: () => void;
  onChanged: (contact: PortalContact) => void;
}) {
  const mine = normaliseText(contact.claimedBy ?? "") === normaliseText(me);
  const [tab, setTab] = useState<Tab>(mine ? "messages" : "details");

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={reduced ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-foreground">
              {contact.contactName}
            </h2>
            <p className="truncate text-sm text-muted">
              {contact.company} · {contact.seat}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        {!mine ? (
          <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
            {contact.claimedBy
              ? `${contact.claimedBy} is inviting them. The toolkit and editing open up for whoever claims a contact.`
              : "Claim this contact to edit their details and get the invite toolkit."}
          </p>
        ) : null}

        <div className="mt-4 flex gap-1 border-b border-border">
          {(["details", "messages", "tips"] as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-t-md px-3 py-2.5 text-sm font-semibold capitalize transition ${
                tab === id
                  ? "border border-b-0 border-border bg-white text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {id === "tips" ? "Why it matters" : id}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {tab === "details" ? (
            <Details
              contact={contact}
              mine={mine}
              password={password}
              sessionId={sessionId}
              me={me}
              onChanged={onChanged}
            />
          ) : null}
          {tab === "messages" ? (
            <Messages contact={contact} me={me} meetingLabel={meetingLabel} />
          ) : null}
          {tab === "tips" ? <Tips constants={constants} /> : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Details({
  contact,
  mine,
  password,
  sessionId,
  me,
  onChanged,
}: {
  contact: PortalContact;
  mine: boolean;
  password: string;
  sessionId: string | null;
  me: string;
  onChanged: (c: PortalContact) => void;
}) {
  const [form, setForm] = useState({
    company: contact.company,
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    website: contact.website ?? "",
    notes: contact.notes ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveContactEdits(password, contact.id, me, form, sessionId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      onChanged(result.data);
      setMessage("Saved ✓");
    });
  }

  function toggleInvited() {
    startTransition(async () => {
      const result = await markInvited(password, contact.id, me, !contact.invitedAt, sessionId);
      if (result.ok) onChanged(result.data);
      else setMessage(result.error);
    });
  }

  if (!mine) {
    return (
      <dl className="space-y-2 text-sm">
        <Row label="Company" value={contact.company} />
        <Row label="Phone" value={contact.phone} />
        <Row label="Email" value={contact.email} />
        <Row label="Website" value={contact.website} />
        <Row label="Added by" value={contact.submitterName} />
        <Row label="Notes" value={contact.notes} />
      </dl>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
      <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
      <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
      <Field
        label="Website"
        hint="we'll tidy it into a proper link"
        value={form.website}
        onChange={(v) => setForm({ ...form, website: v })}
      />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-foreground">
          Notes <em className="font-normal not-italic text-muted">(how you know them, what to say)</em>
        </span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2.5 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
        />
      </label>

      {message ? <p className="text-sm font-semibold text-foreground">{message}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={save}
          className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          Save details
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={toggleInvited}
          className={`rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60 ${
            contact.invitedAt
              ? "border border-border bg-white text-muted"
              : "bg-[#1F7A3E] text-white"
          }`}
        >
          {contact.invitedAt ? "Mark as not invited yet" : "I've invited them"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3 border-b border-border pb-2">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-foreground">
        {label}
        {hint ? <em className="ml-1 font-normal not-italic text-muted">({hint})</em> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2.5 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
      />
    </label>
  );
}

/** Fills the placeholders so what lands on the clipboard is ready to send. */
function fillTemplate(
  template: MessageTemplate,
  contact: PortalContact,
  me: string,
  meetingLabel: string,
): string {
  const firstName = contact.contactName.trim().split(/\s+/)[0] ?? contact.contactName;
  const body = template.body
    .replaceAll("{{FirstName}}", firstName)
    .replaceAll("{{Name}}", contact.contactName)
    .replaceAll("{{Company}}", contact.company)
    .replaceAll("{{MyName}}", me)
    .replaceAll("{{MeetingDate}}", meetingLabel);
  return template.subject ? `Subject: ${template.subject}\n\n${body}` : body;
}

function Messages({
  contact,
  me,
  meetingLabel,
}: {
  contact: PortalContact;
  me: string;
  meetingLabel: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(template: MessageTemplate) {
    const text = fillTemplate(template, contact, me, meetingLabel);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(template.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Already filled in with {contact.contactName.split(" ")[0]}&rsquo;s details and
        your name. Copy, read it back, send.
      </p>
      {MESSAGE_TEMPLATES.map((template) => (
        <div key={template.id} className="rounded-2xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                {template.channel}
              </span>
              <p className="mt-1.5 text-sm font-bold text-foreground">{template.label}</p>
              <p className="text-xs text-muted">{template.hint}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(template)}
              className="rounded-lg bg-bni px-4 py-2.5 text-sm font-bold text-white"
            >
              {copied === template.id ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface-muted px-3 py-3 font-sans text-[13px] leading-relaxed text-foreground">
            {fillTemplate(template, contact, me, meetingLabel)}
          </pre>
        </div>
      ))}
      {copied === "failed" ? (
        <p className="text-sm font-semibold text-bni">
          Couldn&rsquo;t copy automatically — select the text and copy it by hand.
        </p>
      ) : null}
    </div>
  );
}

function Tips({ constants }: { constants: WorkshopConstants }) {
  return (
    <div className="space-y-5">
      <WhyItMatters constants={constants} />

      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
          Six things that work
        </h3>
        <div className="mt-2 space-y-2">
          {INVITE_TIPS.map((tip) => (
            <div key={tip.title} className="rounded-xl border border-border bg-white p-4">
              <p className="text-sm font-bold text-foreground">{tip.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
          Worth a listen
        </h3>
        <p className="mt-1 text-sm text-muted">
          From the official BNI podcast, all on inviting visitors. Most are under
          fifteen minutes.
        </p>
        <div className="mt-2 space-y-2">
          {PODCASTS.map((cast) => (
            <a
              key={cast.episode}
              href={cast.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-white p-4 transition hover:border-bni"
            >
              <p className="text-sm font-bold text-foreground">
                <span className="text-bni">Ep {cast.episode}</span> · {cast.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{cast.summary}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The two closing slides, in a form a member can read on a phone. */
function WhyItMatters({ constants }: { constants: WorkshopConstants }) {
  const [contacts, setContacts] = useState<number | null>(null);
  const network = projectNetwork(contacts ?? 0, constants);
  const value = projectMemberValue(contacts ?? 0, constants);

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
        What your invitation is worth
      </h3>
      <p className="mt-1 text-sm text-muted">
        The sums from the workshop. Change the number to see what a different list
        would do.
      </p>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-bold text-foreground">
          Contacts listed
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={contacts ?? ""}
          onChange={(e) => setContacts(e.target.value === "" ? null : Number(e.target.value))}
          placeholder="e.g. 80"
          className="w-32 rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2.5 text-base outline-none focus:border-bni"
        />
      </label>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Fact label="Visitors" value={formatCount(network.visitors)} />
        <Fact label="New members" value={formatCount(network.newMembers)} />
        <Fact label="Chapter" value={`${network.membersAfter} members`} />
        <Fact
          label="Connections"
          value={`${formatCount(network.connectionsAfter)} (+${Math.round(network.connectionsGrowthPct)}%)`}
        />
      </dl>

      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {value.rows.map((row) => (
          <Fact
            key={row.key}
            label={row.label}
            value={`+${row.money ? formatMoney(row.delta) : formatCount(row.delta)} a year`}
            accent
          />
        ))}
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Based on the chapter&rsquo;s own PALMS figures: {constants.membersToday} members
        today, {Math.round(constants.visitorRate * 100)}% of listed contacts visiting and{" "}
        {(constants.conversionRate * 100).toFixed(1)}% of visitors joining.
      </p>
    </div>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${accent ? "bg-[#FFFBEF]" : "bg-surface-muted"}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </dt>
      <dd className={`mt-0.5 text-sm font-bold ${accent ? "text-[#1F7A3E]" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
