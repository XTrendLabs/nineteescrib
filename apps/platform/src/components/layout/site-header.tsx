import { Button } from "@propertyos/ui/components/button";
import { Separator } from "@propertyos/ui/components/separator";
import { SidebarTrigger } from "@propertyos/ui/components/sidebar";
import { PlusIcon } from "lucide-react";

import { HeaderBreadcrumb } from "./header-breadcrumb";
import { PlatformSearch } from "./platform-search";

export function SiteHeader({
  title,
  onSelectHq,
  onSelectProperty,
  onAddProperty,
}: {
  title: string;
  onSelectHq: () => void;
  onSelectProperty: (propertyId: string, name: string) => void;
  onAddProperty: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-border border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <HeaderBreadcrumb hqLabel={title} />
      </div>
      <div className="flex items-center gap-2 px-4">
        <PlatformSearch
          onSelectHq={onSelectHq}
          onSelectProperty={onSelectProperty}
        />
        <Button size="sm" onClick={onAddProperty}>
          <PlusIcon />
          Add Property
        </Button>
      </div>
    </header>
  );
}
