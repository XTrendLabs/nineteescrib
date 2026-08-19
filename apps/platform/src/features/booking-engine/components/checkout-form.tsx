import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";

import { ARRIVAL_TIME_OPTIONS } from "@/features/booking-engine/lib/mock-data";

export type GuestDetailsFormValue = {
  fullName: string;
  phone: string;
  email: string;
  arrivalTime: string;
  specialRequests: string;
  gstin: string;
};

export function CheckoutForm({
  value,
  onChange,
}: {
  value: GuestDetailsFormValue;
  onChange: (value: GuestDetailsFormValue) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium text-sm">Guest Details</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
          placeholder="Arjun Sen"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone Number (WhatsApp) *</Label>
        <PhoneInput
          id="phone"
          value={value.phone}
          onChange={(phone) => onChange({ ...value, phone })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder="arjun@email.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="arrivalTime">Estimated Arrival Time</Label>
        <Select
          value={value.arrivalTime}
          onValueChange={(arrivalTime) => onChange({ ...value, arrivalTime })}
        >
          <SelectTrigger id="arrivalTime">
            <SelectValue placeholder="Select a time window">
              {(v: unknown) => (v as string) || "Select a time window"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ARRIVAL_TIME_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <textarea
          id="specialRequests"
          value={value.specialRequests}
          onChange={(e) =>
            onChange({ ...value, specialRequests: e.target.value })
          }
          placeholder="Late check-in planned."
          rows={3}
          className="w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <details className="group border-t pt-3">
        <summary className="cursor-pointer font-medium text-xs">
          B2B Corporate Info (Optional)
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input
            id="gstin"
            value={value.gstin}
            onChange={(e) => onChange({ ...value, gstin: e.target.value })}
            placeholder="30AABCS1234A1ZV"
          />
        </div>
      </details>
    </div>
  );
}
