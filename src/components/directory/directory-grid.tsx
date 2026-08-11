"use client";

import { useMemo, useState } from "react";
import type { Member } from "@/db/schema";
import { PublicMemberCard } from "@/components/directory/public-member-card";

type DirectoryGridProps = {
  members: Member[];
};

export function DirectoryGrid({ members }: DirectoryGridProps) {
  const [query, setQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return members;

    return members.filter((member) => {
      const haystack = [
        member.firstName,
        member.lastName,
        member.company,
        member.bniSeat,
        ...(member.chapterRoles ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [members, query]);

  return (
    <section id="members" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
            Member directory
          </h2>
          <p className="mt-3 text-base text-muted">
            Search by name, company or trade seat. Open a profile for company
            details, contact information and LinkedIn.
          </p>
        </div>

        <label className="block w-full max-w-md space-y-1.5">
          <span className="text-sm font-medium text-foreground">Find a member</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company or seat..."
            className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm outline-none ring-bni/20 transition focus:ring-2"
          />
        </label>
      </div>

      <p className="mt-6 text-sm text-muted">
        Showing {filteredMembers.length} of {members.length} active members
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-white/70 px-6 py-10 text-center text-sm text-muted">
            No members match your search. Try another name, company or trade seat.
          </p>
        ) : (
          filteredMembers.map((member) => (
            <PublicMemberCard key={member.id} member={member} />
          ))
        )}
      </div>
    </section>
  );
}
