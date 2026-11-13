"use server";

import { getLiveSession } from "@/lib/workshop/session";
import {
  claimContact,
  getPortalSessionId,
  getPortalStats,
  listPortalContacts,
  releaseContact,
  setInvited,
  updateContact,
  verifyPortalPassword,
  type ContactEdits,
  type PortalContact,
  type PortalStats,
} from "@/lib/workshop/portal";
import { getWorkshopRoster, memberKey } from "@/lib/workshop/roster";

/**
 * Every action re-checks the password.
 *
 * The portal sends it with each request rather than holding a session, which
 * keeps it to one shared secret Harry can read out from the front. Guarding
 * only the page would guard nothing: these are ordinary POST endpoints.
 */
async function authorise(password: string) {
  const session = await getLiveSession();
  if (!verifyPortalPassword(session.portalPassword, password)) {
    throw new Error("PORTAL_DENIED");
  }
  // The password belongs to the live session, which is what admin controls;
  // the contacts belong to the most recent run that has any.
  return { session, contactsSessionId: await getPortalSessionId(session.id) };
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function openPortal(
  password: string,
): Promise<Result<{ contacts: PortalContact[]; names: string[] }>> {
  const session = await getLiveSession();
  if (!session.portalPassword) {
    return { ok: false, error: "The portal isn't open yet. Ask Harry for the password." };
  }
  if (!verifyPortalPassword(session.portalPassword, password)) {
    return { ok: false, error: "That password isn't right." };
  }

  const contactsSessionId = await getPortalSessionId(session.id);
  const [contacts, roster] = await Promise.all([
    listPortalContacts(contactsSessionId),
    getWorkshopRoster(),
  ]);
  return { ok: true, data: { contacts, names: roster.map((m) => m.name) } };
}

export async function refreshPortal(
  password: string,
  memberName: string | null,
): Promise<Result<{ contacts: PortalContact[]; stats: PortalStats }>> {
  try {
    const { contactsSessionId } = await authorise(password);
    const [contacts, stats] = await Promise.all([
      listPortalContacts(contactsSessionId),
      getPortalStats(contactsSessionId, memberName),
    ]);
    return { ok: true, data: { contacts, stats } };
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
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password);
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
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password);
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
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password);
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
): Promise<Result<PortalContact>> {
  try {
    const { contactsSessionId } = await authorise(password);
    const result = await setInvited(contactsSessionId, contactId, memberName, invited);
    return result.ok ? { ok: true, data: result.contact } : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: "Signed out. Enter the password again." };
  }
}
