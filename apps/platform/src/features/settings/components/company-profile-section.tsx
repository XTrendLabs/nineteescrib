import { Button } from "@propertyos/ui/components/button";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useState } from "react";

import { MOCK_COMPANY_PROFILE } from "@/features/settings/lib/mock-data";

export function CompanyProfileSection() {
  const feedback = useFeedback();
  const [profile, setProfile] = useState(MOCK_COMPANY_PROFILE);

  function update<K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    feedback.success(
      "Company profile updated",
      "Your changes have been saved.",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Company Profile</h2>
          <p className="text-muted-foreground text-xs">
            The business identity that appears on invoices, owner statements,
            and legal footers.
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Business Identity
        </h3>
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 border border-dashed text-[10px] text-muted-foreground">
            Logo
          </div>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Company Name *</FieldLabel>
              <Input
                value={profile.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Display Name</FieldLabel>
              <Input
                value={profile.displayName}
                onChange={(e) => update("displayName", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Slug</FieldLabel>
              <Input value={profile.slug} disabled />
            </Field>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Registered Address
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel>Address Line 1</FieldLabel>
            <Input
              value={profile.addressLine1}
              onChange={(e) => update("addressLine1", e.target.value)}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Address Line 2</FieldLabel>
            <Input
              value={profile.addressLine2}
              onChange={(e) => update("addressLine2", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>City</FieldLabel>
            <Input
              value={profile.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>State</FieldLabel>
            <Input
              value={profile.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Country</FieldLabel>
            <Input
              value={profile.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>PIN</FieldLabel>
            <Input
              value={profile.pin}
              onChange={(e) => update("pin", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Legal &amp; Tax Identity
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel>PAN Number</FieldLabel>
            <Input
              value={profile.pan}
              onChange={(e) => update("pan", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>GSTIN</FieldLabel>
            <Input
              value={profile.gstin}
              onChange={(e) => update("gstin", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>CIN (optional)</FieldLabel>
            <Input
              value={profile.cin ?? ""}
              onChange={(e) => update("cin", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Contact
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Business Email</FieldLabel>
            <Input
              type="email"
              value={profile.businessEmail}
              onChange={(e) => update("businessEmail", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Business Phone</FieldLabel>
            <Input
              value={profile.businessPhone}
              onChange={(e) => update("businessPhone", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Support Email</FieldLabel>
            <Input
              type="email"
              value={profile.supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Website</FieldLabel>
            <Input
              value={profile.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
