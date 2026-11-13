"use server";

import { getLiveSession } from "@/lib/workshop/session";
import {
  claimContact,
  getSessionPassword,
  getPortalStats,
  listPortalContacts,
  listPortalSessions,
  releaseContact,
  resolvePortalSessionId,
  setInvited,
  updateContact,
  verifyPortalPassword,
  type ContactEdits,
  type PortalContact,
  type PortalSessionSummary,
  type PortalStats,
} from "@/lib/workshop/portal";
import { getWorkshopRoster, memberKey } from "@/lib/workshop/roster";

/**
 * Every action re-checks the password.
 *
 * The portal sends it with each request rather than holding a session, which
 * keeps it to one shared secret Harry can read out from the front. Guarding
 * only the page would guard nothing: these are ordinary POST endpoints.
 *
 * The live session's password opens every run, so starting a new session never
 * locks members out of the list they are still working through; an older run's
 * own password opens that run too, so a link shared on the night keeps working
 * after the password has been changed.
 */
async function authorise(password: string, requestedSessionId: string | null) {
  const live = await getLiveSession();
  const contactsSessionId = await resolvePortalSessionId(live.id, requestedSessionId);

  let allowed = verifyPortalPassword(live.portalPassword, password);
  if (!allowed && contactsSessionId !== live.id) {
    allowed = verifyPortalPassword(await getSessionPassword(contactsSessionId), password);
  }
  if (!allowed) throw new Error("PORTAL_DENIED");

  return { session: live, contactsSessionId };
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type PortalPayload = {
  contacts: PortalContact[];
  names: string[];
  sessionId: string;
  sessions: PortalSessionSummary[];
};

export async function openPortal(
  password: string,
  requestedSessionId: string | null = null,
): Promise<Result<PortalPayload>> {
  const live = await getLiveSession();
  const contactsSessionId = await resolvePortalSessionId(live.id, requestedSessionId);

  const stored =
    contactsSessionId === live.id
      ? live.portalPassword
      : ((await getSessionPassword(contactsSessionId)) ?? live.portalPassword);

  if (!live.portalPassword && !stored) {
    return { ok: false, error: "The portal isn't open yet. Ask Harry for the password." };
  }
  if (
    !verifyPortalPassword(live.portalPassword, password) &&
    !verifyPortalPassword(stored, password)
  ) {
    return { ok: false, error: "That password isn't right." };
  }

  const [contacts, roster, sessions] = await Promise.all([
    listPortalContacts(contactsSessionId),
    getWorkshopRoster(),
    listPortalSessions(),
  ]);
  return {
    ok: true,
    data: { contacts, names: roster.map((m) => m.name), sessionId: contactsSessionId, sessions },
  };
}

export async function refreshPortal(
  password: string,
  memberName: string | null,
  requestedSessionId: string | null = null,
): Promise<Result<PortalPayload & { stats: PortalStats }>> {
  try {
    const { contactsSessionId } = await authorise(password, requestedSessionId);
    // The roster comes back on every refresh, not only on sign-in: a member
    // returning days later has a stored password and no roster, and was being
    // offered a name list scraped off the contacts instead.
    const [contacts, stats, roster, sessions] = await Promise.all([
      listPortalContacts(contactsSessionId),
      getPortalStats(contactsSessionId, memberName),
      getWorkshopRoster(),
      listPortalSessions(),
    ]);
    return {
      ok: true,
      data: {
        contacts,
        stats,
        names: roster.map((m) => m.name),
        sessionId: contactsSessionId,
        sessions,
      },
    };
  } catch {
    return { ok: false, error: "Signed out. Enter the password again." };
  }
}

/** The member must be on the roster, so the board never shows a typed name. */
async function requireMember(name: string): Promise<string> {
  const roster = await getWorkshopRoster();
  const match = roster.find((m) => memberKey(m.name) === memberKey(name));
  if (!match) throw new Error("NOT_A_MEMBER");
  return match.name;
}

export async function claimForMe(
  password: string,
  contactId: string,
  memberName: string,
  requestedSessionId: string | null = null,
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password, requestedSessionId);
    const name = await requireMember(memberName);
    const result = await claimContact(contactsSessionId, contactId, name);
    return result.ok ? { ok: true, data: result.contact } : { ok: false, error: result.error };
  } catch (error) {
    return {
      ok: false,
      error:
        (error as Error).message === "NOT_A_MEMBER"
          ? "Pick your name from the list first."
          : "Signed out. Enter the password again.",
    };
  }
}

export async function releaseMine(
  password: string,
  contactId: string,
  memberName: string,
  requestedSessionId: string | null = null,
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password, requestedSessionId);
    const result = await releaseContact(contactsSessionId, contactId, memberName);
    return result.ok ? { ok: true, data: result.contact } : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: "Signed out. Enter the password again." };
  }
}

export async function saveContactEdits(
  password: string,
  contactId: string,
  memberName: string,
  edits: ContactEdits,
  requestedSessionId: string | null = null,
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password, requestedSessionId);
    const result = await updateContact(contactsSessionId, contactId, memberName, edits);
    return result.ok ? { ok: true, data: result.contact } : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: "Signed out. Enter the password again." };
  }
}

export async function markInvited(
  password: string,
  contactId: string,
  memberName: string,
  invited: boolean,
  requestedSessionId: string | null = null,
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password, requestedSessionId);
    const result = await setInvited(contactsSessionId, contactId, memberName, invited);
    return result.ok ? { ok: true, data: result.contact } : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: "Signed out. Enter the password again." };
  }
}
