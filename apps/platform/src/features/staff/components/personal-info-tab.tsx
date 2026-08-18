import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { format } from "date-fns";
import { useState } from "react";
import type { StaffMember } from "../lib/mock-data";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function PersonalInfoTab({ staff }: { staff: StaffMember }) {
  const feedback = useFeedback();
  const [form, setForm] = useState({
    fullName: staff.fullName,
    phone: staff.phone,
    email: staff.email ?? "",
    dateOfBirth: staff.dateOfBirth
      ? format(staff.dateOfBirth, "yyyy-MM-dd")
      : "",
    gender: staff.gender ?? "other",
    addressLine1: staff.addressLine1 ?? "",
    addressLine2: staff.addressLine2 ?? "",
    city: staff.city ?? "",
    state: staff.state ?? "",
    pinCode: staff.pinCode ?? "",
    emergencyName: staff.emergencyName ?? "",
    emergencyPhone: staff.emergencyPhone ?? "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full Name *">
          <Input
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </Field>
        <Field label="Phone Number *">
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="Date of Birth">
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
        </Field>
        <Field label="Gender">
          <Select
            value={form.gender}
            onValueChange={(v) => update("gender", v as typeof form.gender)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div />
        <Field label="Address Line 1">
          <Input
            value={form.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
          />
        </Field>
        <Field label="Address Line 2">
          <Input
            value={form.addressLine2}
            onChange={(e) => update("addressLine2", e.target.value)}
          />
        </Field>
        <Field label="City">
          <Input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </Field>
        <Field label="State">
          <Input
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          />
        </Field>
        <Field label="PIN Code">
          <Input
            value={form.pinCode}
            onChange={(e) => update("pinCode", e.target.value)}
          />
        </Field>
        <div />
        <Field label="Emergency Contact Name">
          <Input
            value={form.emergencyName}
            onChange={(e) => update("emergencyName", e.target.value)}
          />
        </Field>
        <Field label="Emergency Contact Phone">
          <Input
            value={form.emergencyPhone}
            onChange={(e) => update("emergencyPhone", e.target.value)}
          />
        </Field>
      </div>

      <Button
        className="self-start"
        onClick={() =>
          feedback.success(
            "Profile saved",
            `${form.fullName}'s personal information has been updated.`,
          )
        }
      >
        Save Changes
      </Button>
    </div>
  );
}
