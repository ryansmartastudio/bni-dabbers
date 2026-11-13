import Link from "next/link";
import { cn } from "@/lib/utils";

export type AdminTabId = "live" | "sessions";

/**
 * Tabs as links rather than client state, so a tab is addressable — Harry can
 * keep the controls open on one device and the history on another.
 */
export function AdminTabs({
  active,
  secret,
  basePath,
  sim,
}: {
  active: AdminTabId;
  secret: string;
  basePath: string;
  sim: boolean;
}) {
  const tabs: Array<{ id: AdminTabId; label: string; href: string }> = [
    { id: "live", label: "Session controls", href: "" },
    { id: "sessions", label: "Previous sessions", href: "?tab=sessions" },
  ];

  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1 px-1" role="tablist" aria-label="Workshop admin">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const query = tab.href
            ? `${tab.href}${sim ? "&sim=1" : ""}`
            : sim
              ? "?sim=1"
              : "";
          return (
            <Link
              key={tab.id}
              href={`${basePath}/admin/${secret}${query}`}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "rounded-t-md px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "border border-b-0 border-border bg-white text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
