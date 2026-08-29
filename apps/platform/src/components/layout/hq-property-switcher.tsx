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
import {
  useActiveHq,
  useCachedActiveOrganization,
} from "@/features/auth/api/use-cached-organizations";
import { useAccessibleProperties } from "@/features/properties/api/use-accessible-properties";

export function HqPropertySwitcher({
  activeView,
  onSelectHq,
  onSelectProperty,
  onAddProperty,
}: {
  activeView: { type: "hq" } | { type: "property"; propertyId: string };
  onSelectHq: (hqId: string) => void;
  onSelectProperty: (propertyId: string) => void;
  onAddProperty: () => void;
}) {
  const { isMobile } = useSidebar();
  // The switcher lists what the user can switch *into*, so it is keyed to
  // their memberships rather than the active organization -- scoping it to the
  // active org made the list collapse to a single entry once a property was
  // selected, stranding the user there.
  const { hqs, activeHqId, activeHq } = useActiveHq();
  const { data: properties, isPending: isLoadingProperties } =
    useAccessibleProperties();
  // The active organization carries its own name, so the label is right on the
  // first paint -- looking it up in the property list would read "Property"
  // until that request lands, and stay wrong for a member who cannot list it.
  const { data: activeOrganization } = useCachedActiveOrganization();

  const label =
    activeView.type === "hq"
      ? (activeHq?.name ?? "HQ")
      : (activeOrganization?.name ?? "Property");
  const description =
    activeView.type === "hq"
      ? "All properties"
      : (activeHq?.name ?? "Managing this property");

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
            {hqs?.length ? (
              <>
                <DropdownMenuGroup>
                  {hqs.map((hq) => (
                    <DropdownMenuItem
                      key={hq.id}
                      className={cn(
                        "gap-2 px-4 py-2 hover:bg-white/90 hover:text-black",
                        activeView.type === "hq" &&
                          activeHqId === hq.id &&
                          "bg-white/90 text-black",
                      )}
                      onClick={() => onSelectHq(hq.id)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <LayoutGridIcon className="size-3.5" />
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{hq.name}</span>
                        <span className="shrink-0 text-xs">
                          (All properties)
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ) : null}

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
                    onClick={() => onSelectProperty(property.id)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Building2Icon className="size-3.5" />
                    </div>
                    <div className="truncate">{property.name}</div>
                  </DropdownMenuItem>
                ))
              ) : isLoadingProperties ? (
                <div className="px-4 py-2 text-muted-foreground text-xs">
                  Loading properties...
                </div>
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
