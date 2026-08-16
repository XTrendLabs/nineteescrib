"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@propertyos/ui/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> & {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: RPNInput.Country;
};

const RPNPhoneInput =
  RPNInput.default as unknown as React.ForwardRefExoticComponent<
    React.ComponentProps<typeof RPNInput.default> &
      React.RefAttributes<HTMLInputElement>
  >;

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { className, value = "", onChange, defaultCountry = "IN", ...props },
    ref,
  ) => {
    const handleValueChange = (val?: string) => {
      onChange?.(val || "");
    };

    return (
      <RPNPhoneInput
        ref={ref}
        value={value}
        onChange={handleValueChange}
        defaultCountry={defaultCountry}
        inputComponent={InputComponent}
        countrySelectComponent={CountrySelectComponent}
        className={cn("flex items-center gap-2", className)}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

// Explicit wrapper for custom input components
const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <InputPrimitive
    className={cn(
      "h-8 w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
      className,
    )}
    {...props}
    ref={ref}
  />
));

InputComponent.displayName = "InputComponent";

interface CountrySelectComponentProps {
  value?: RPNInput.Country;
  onChange: (value?: RPNInput.Country) => void;
  options: { value?: RPNInput.Country; label: string }[];
  disabled?: boolean;
}

const CountrySelectComponent = ({
  value,
  onChange,
  options,
  disabled,
}: CountrySelectComponentProps) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const activeCountry = value;

  // Filter countries based on search term
  const filteredOptions = options
    .map((opt) => ({
      code: opt.value,
      name: opt.value ? en[opt.value] || opt.label : opt.label,
      callingCode: opt.value ? RPNInput.getCountryCallingCode(opt.value) : "",
    }))
    .filter((item) => {
      if (!item.code) return false;
      const searchLower = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.callingCode.includes(searchLower) ||
        item.code.toLowerCase().includes(searchLower)
      );
    });

  const Flag = activeCountry ? flags[activeCountry] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="flex h-8 gap-1 rounded-none border border-input px-2.5 hover:bg-muted dark:bg-input/30"
            type="button"
            disabled={disabled}
          />
        }
      >
        {Flag ? (
          <span className="inline-flex size-4 shrink-0 items-center justify-center overflow-hidden">
            <Flag title={activeCountry || ""} />
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Globe</span>
        )}
        {activeCountry && (
          <span className="text-muted-foreground text-xs">
            +{RPNInput.getCountryCallingCode(activeCountry)}
          </span>
        )}
        <ChevronDown className="size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="flex w-[280px] flex-col gap-2 border border-border bg-popover p-2 shadow-md dark:bg-card">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-none border border-input pl-8 focus-visible:border-ring focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="flex max-h-[250px] flex-col gap-0.5 overflow-y-auto pr-1">
          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-xs">
              No country found.
            </div>
          ) : (
            filteredOptions.map((item) => {
              const ItemFlag = item.code ? flags[item.code] : null;
              const isSelected = item.code === activeCountry;

              return (
                <button
                  key={item.code || "unknown"}
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected &&
                      "bg-accent font-semibold text-accent-foreground",
                  )}
                  onClick={() => {
                    if (item.code) {
                      onChange(item.code);
                    }
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {ItemFlag ? (
                    <span className="inline-flex size-4 shrink-0 items-center justify-center overflow-hidden">
                      <ItemFlag title={item.code || ""} />
                    </span>
                  ) : (
                    <div className="size-4 shrink-0 rounded-full bg-muted" />
                  )}
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    +{item.callingCode}
                  </span>
                  {isSelected && (
                    <Check className="ml-1 size-3.5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export type { PhoneInputProps };
export { PhoneInput };
