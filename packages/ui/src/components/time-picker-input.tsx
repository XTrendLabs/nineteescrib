import { cn } from "@propertyos/ui/lib/utils";
import * as React from "react";

import {
  getArrowByType,
  getDateByType,
  type Period,
  setDateByType,
  type TimePickerType,
} from "./time-picker-utils";

export type TimePickerInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "onKeyDown"
> & {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
};

const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    {
      className,
      picker,
      date,
      setDate,
      period,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref,
  ) => {
    const [flag, setFlag] = React.useState(false);

    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => setFlag(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [flag]);

    const calculatedValue = React.useMemo(
      () => (date ? getDateByType(date, picker) : ""),
      [date, picker],
    );

    function calculateNewValue(key: string) {
      if (picker === "12hours") {
        if (flag && calculatedValue.slice(1, 2) === "1" && key === "0") {
          return `0${key}`;
        }
        return !flag ? `0${key}` : calculatedValue.slice(1, 2) + key;
      }
      return !flag ? `0${key}` : calculatedValue.slice(1, 2) + key;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Tab") return;
      e.preventDefault();
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        const step = e.key === "ArrowUp" ? 1 : -1;
        const newValue = getArrowByType(calculatedValue, step, picker);
        if (flag) setFlag(false);
        const tempDate = date ? new Date(date) : new Date();
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
      if (e.key >= "0" && e.key <= "9") {
        if (picker === "12hours") setFlag(true);
        const newValue = calculateNewValue(e.key);
        if (flag) onRightFocus?.();
        const tempDate = date ? new Date(date) : new Date();
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
    }

    return (
      <input
        ref={ref}
        id={props.id ?? picker}
        name={props.name ?? picker}
        className={cn(
          "h-8 w-[48px] rounded-none border border-input bg-transparent text-center text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        value={calculatedValue}
        placeholder="--"
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        type="text"
        inputMode="decimal"
        {...props}
      />
    );
  },
);
TimePickerInput.displayName = "TimePickerInput";

export { TimePickerInput };
