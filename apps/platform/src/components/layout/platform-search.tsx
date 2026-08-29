import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@propertyos/ui/components/command";
import {
  BarChart3Icon,
  Building2Icon,
  LayoutGridIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useProperties } from "@/features/properties/api/use-properties";

export function PlatformSearch({
  onSelectHq,
  onSelectProperty,
}: {
  onSelectHq: (hqId?: string) => void;
  onSelectProperty: (propertyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Search within the HQ in scope: the active organization is the selected
  // property once one is chosen, and a property has no children to list.
  const { activeScopeId } = useActiveHq();
  const { data: properties } = useProperties(activeScopeId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-64 items-center gap-2 rounded-none border bg-transparent px-2.5 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span className="flex-1 text-left">Search PropertyOS...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border bg-muted px-1.5 font-medium font-mono text-[10px]">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search properties, staff, reports..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem
              onSelect={() => {
                onSelectHq();
                setOpen(false);
              }}
            >
              <LayoutGridIcon />
              <span>HQ</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                window.location.href = "/staff";
              }}
            >
              <UsersIcon />
              <span>Staff</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                window.location.href = "/reports";
              }}
            >
              <BarChart3Icon />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>

          {properties?.data?.length ? (
            <CommandGroup heading="Properties">
              {properties.data.map((property) => (
                <CommandItem
                  key={property.id}
                  value={property.name}
                  onSelect={() => {
                    onSelectProperty(property.id);
                    setOpen(false);
                  }}
                >
                  <Building2Icon />
                  <span>{property.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
