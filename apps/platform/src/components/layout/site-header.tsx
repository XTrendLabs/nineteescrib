import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@propertyos/ui/components/breadcrumb";
import { Separator } from "@propertyos/ui/components/separator";
import { SidebarTrigger } from "@propertyos/ui/components/sidebar";

import { PlatformSearch } from "./platform-search";

export function SiteHeader({
  title,
  onSelectHq,
  onSelectProperty,
}: {
  title: string;
  onSelectHq: () => void;
  onSelectProperty: (propertyId: string, name: string) => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-border border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="px-4">
        <PlatformSearch
          onSelectHq={onSelectHq}
          onSelectProperty={onSelectProperty}
        />
      </div>
    </header>
  );
}
