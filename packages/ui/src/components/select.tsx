"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@propertyos/ui/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Children, isValidElement, type ReactNode, useRef } from "react";

type SelectItemEntry = { value: unknown; label: ReactNode };

/** Recursively collects {value, label} from nested SelectItem children so SelectValue can auto-resolve labels without every call site wiring up an `items` prop. */
function collectItems(children: ReactNode): SelectItemEntry[] {
  const items: SelectItemEntry[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === SelectItem) {
      const props = child.props as { value: unknown; children: ReactNode };
      items.push({ value: props.value, label: props.children });
      return;
    }

    const props = child.props as { children?: ReactNode } | undefined;
    if (props?.children) {
      items.push(...collectItems(props.children));
    }
  });

  return items;
}

function sameItems(a: SelectItemEntry[], b: SelectItemEntry[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.value === b[index]?.value && item.label === b[index]?.label,
  );
}

function Select({ children, ...props }: SelectPrimitive.Root.Props<unknown>) {
  const itemsRef = useRef<SelectItemEntry[]>([]);
  const nextItems = collectItems(children);
  if (!sameItems(itemsRef.current, nextItems)) {
    itemsRef.current = nextItems;
  }

  return (
    <SelectPrimitive.Root
      data-slot="select"
      items={itemsRef.current}
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  );
}

function SelectGroup({ ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-8 w-full items-center justify-between gap-2 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  align = "start",
  sideOffset = 4,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "sideOffset">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-none bg-popover text-popover-foreground shadow-md outline-none ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in",
            className,
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-none py-2 pr-8 pl-2 text-xs outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectGroupLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn("px-2 py-2 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
};
