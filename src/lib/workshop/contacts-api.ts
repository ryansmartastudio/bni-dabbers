/**
 * One feature test, used by the workshop and by the page that checks it.
 *
 * It was duplicated, and the two copies disagreed the moment one of them was
 * tightened — which is how the import button quietly vanished on Samsung
 * Internet while the check page still claimed everything was fine.
 */

export type ContactsApi = {
  select: (
    props: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
  getProperties?: () => Promise<string[]>;
};

/**
 * Test the thing we actually call, and nothing else.
 *
 * The spec's own test also asks for `ContactsManager` on window. Requiring it
 * hid the button on Samsung Internet, which exposes a working
 * `navigator.contacts.select` without it. A browser offering the method gets
 * the button; if the call then fails there is a fallback in front of them,
 * whereas hiding it leaves no clue the feature was ever there.
 */
export function hasContactsApi(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    typeof (navigator as Navigator & { contacts?: ContactsApi }).contacts?.select ===
    "function"
  );
}

export function getContactsApi(): ContactsApi | null {
  if (!hasContactsApi()) return null;
  return (navigator as Navigator & { contacts?: ContactsApi }).contacts ?? null;
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Samsung's default browser, which is where this all went wrong. */
export function isSamsungInternet(): boolean {
  if (typeof navigator === "undefined") return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
}

/** Chrome proper, not one of the Chromium browsers that claim to be it. */
export function isChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Chrome\//.test(ua) && !/SamsungBrowser|EdgA|OPR|Firefox|DuckDuckGo|YaBrowser/i.test(ua);
}

/** Never changes within a session, so there is nothing to subscribe to. */
export function subscribeNoop() {
  return () => {};
}
