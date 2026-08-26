import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@propertyos/ui/components/breadcrumb";
import { Link, useRouterState } from "@tanstack/react-router";
import { settingsNavGroups } from "@/features/settings/lib/nav";
import { navMainGroups } from "./nav-data";

const TITLE_BY_URL = new Map(
  navMainGroups
    .flatMap((group) => group.items)
    .map((item) => [item.url, item.title] as const),
);
for (const group of settingsNavGroups) {
  for (const item of group.items) {
    TITLE_BY_URL.set(item.url, item.title);
  }
}

type Crumb = {
  label: string;
  url: string;
};

function buildCrumbs(pathname: string, hqLabel: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: hqLabel, url: "/" }];

  if (pathname === "/") {
    return crumbs;
  }

  const segments = pathname.split("/").filter(Boolean);
  let url = "";
  for (const segment of segments) {
    url += `/${segment}`;
    const label = TITLE_BY_URL.get(url) ?? toTitleCase(segment);
    crumbs.push({ label, url });
  }

  return crumbs;
}

function toTitleCase(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function HeaderBreadcrumb({ hqLabel }: { hqLabel: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = buildCrumbs(pathname, hqLabel);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={crumb.url} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link to={crumb.url} />}
                    className="hover:underline"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
