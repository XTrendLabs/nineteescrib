import { cn } from "@propertyos/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";

import { settingsNavGroups } from "@/features/settings/lib/nav";

export function SettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-5" aria-label="Settings">
      {settingsNavGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
            {group.label}
          </span>
          {group.items.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center justify-between gap-2 px-2 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
                {item.soon && (
                  <span className="shrink-0 font-medium text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
