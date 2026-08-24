import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { convert12HourTo24Hour, type Period } from "./time-picker-utils";

export type PeriodSelectProps = {
  period: Period;
  setPeriod: (period: Period) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  onLeftFocus?: () => void;
};

const TimePeriodSelect = React.forwardRef<HTMLButtonElement, PeriodSelectProps>(
  ({ period, setPeriod, date, setDate, onLeftFocus }, ref) => {
    function handleValueChange(value: unknown) {
      const newPeriod = value as Period;
      setPeriod(newPeriod);

      if (date) {
        const tempDate = new Date(date);
        const hours = tempDate.getHours();
        const convertedHours = convert12HourTo24Hour(
          hours % 12 || 12,
          newPeriod,
        );
        tempDate.setHours(convertedHours);
        setDate(tempDate);
      }
    }

    return (
      <Select value={period} onValueChange={handleValueChange}>
        <SelectTrigger
          ref={ref}
          className="w-[65px]"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onLeftFocus?.();
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    );
  },
);
TimePeriodSelect.displayName = "TimePeriodSelect";

export { TimePeriodSelect };
