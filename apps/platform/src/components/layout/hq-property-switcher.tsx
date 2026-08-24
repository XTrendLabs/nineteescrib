import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@propertyos/ui/components/sidebar";
import { cn } from "@propertyos/ui/lib/utils";
import {
  Building2Icon,
  ChevronsUpDownIcon,
  LayoutGridIcon,
  PlusIcon,
} from "lucide-react";
import { useCachedActiveOrganization } from "@/features/auth/api/use-cached-organizations";
import { useCachedSession } from "@/features/auth/api/use-cached-session";
import { useProperties } from "@/features/properties/api/use-properties";

export function HqPropertySwitcher({
  activeView,
  onSelectHq,
  onSelectProperty,
  onAddProperty,
}: {
  activeView: { type: "hq" } | { type: "property"; propertyId: string };
  onSelectHq: () => void;
  onSelectProperty: (propertyId: string, name: string) => void;
  onAddProperty: () => void;
}) {
  const { isMobile } = useSidebar();
  const { data: session } = useCachedSession();
  const { data: activeOrganization } = useCachedActiveOrganization();
  const { data: properties } = useProperties(activeOrganization?.id);

  const isOwner = activeOrganization?.members?.some(
    (member) => member.userId === session?.user.id && member.role === "owner",
  );

  const activeProperty =
    activeView.type === "property"
      ? properties?.data?.find((p) => p.id === activeView.propertyId)
      : undefined;

  const label =
    activeView.type === "hq" ? "HQ" : (activeProperty?.name ?? "Property");
  const description =
    activeView.type === "hq" ? "All properties" : "Managing this property";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {activeView.type === "hq" ? (
                <LayoutGridIcon className="size-4" />
              ) : (
                <Building2Icon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{label}</span>
              <span className="truncate text-xs">{description}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="sidebar-scope w-64"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {isOwner && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className={cn(
                      "gap-2 px-4 py-2 hover:bg-white/90 hover:text-black",
                      activeView.type === "hq" && "bg-white/90 text-black",
                    )}
                    onClick={onSelectHq}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <LayoutGridIcon className="size-3.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">HQ</span>

                      <span className="text-xs">(All properties)</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              {properties?.data?.length ? (
                properties.data.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    className={cn(
                      "gap-2 px-4 py-2 hover:bg-white/90 hover:text-black",
                      activeView.type === "property" &&
                        activeView.propertyId === property.id &&
                        "bg-white/90 text-black",
                    )}
                    onClick={() => onSelectProperty(property.id, property.name)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Building2Icon className="size-3.5" />
                    </div>
                    <div className="truncate">{property.name}</div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-4 py-2 text-muted-foreground text-xs">
                  No properties yet
                </div>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 px-4 py-2 hover:bg-white/90 hover:text-black"
                onClick={onAddProperty}
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                  <PlusIcon className="size-3.5" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add property
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
