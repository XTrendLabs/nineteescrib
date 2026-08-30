import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useHasPermission } from "@/features/auth/api/use-permission";
import { api } from "@/shared/lib/api-client";
import { useCompanyProfile } from "../api/use-company-profile";
import { useUpdateCompanyProfile } from "../api/use-update-company-profile";
import {
  type CompanyProfileFormValues,
  companyProfileFormSchema,
  EMPTY_COMPANY_PROFILE,
} from "../lib/company-profile-schema";

export function CompanyProfileSection() {
  const feedback = useFeedback();
  const { activeScopeId } = useActiveHq();
  // Staff can read the profile -- it feeds invoices and guest documents -- but
  // only owners and managers may change it. The server enforces the same split
  // on the PATCH; this just avoids offering an edit that would be refused.
  const canEdit = useHasPermission("organization", "update");

  const { data: response, isLoading } = useCompanyProfile(activeScopeId);
  const updateProfile = useUpdateCompanyProfile();

  const profile = response?.data;

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: EMPTY_COMPANY_PROFILE,
  });

  // The form mounts before the profile arrives, so the fetched values are
  // pushed in once they land. Keyed on the workspace too, so switching
  // properties refills the form instead of leaving the previous one's details
  // on screen.
  useEffect(() => {
    if (!profile) return;
    const { slug: _slug, ...values } = profile;
    form.reset(values);
  }, [profile, form.reset]);

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        query: { activeOrganizationId: activeScopeId ?? "" },
        json: values,
      });
      await api.api.platform.settings["company-profile"].$get.invalidate({
        query: { activeOrganizationId: activeScopeId ?? "" },
      });
      feedback.success(
        "Company profile updated",
        "Your changes have been saved.",
      );
    } catch {
      feedback.error(
        "Couldn't save company profile",
        "Something went wrong. Please try again.",
      );
    }
  });

  if (isLoading) {
    return <CompanyProfileSkeleton />;
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Company Profile</h2>
          <p className="text-muted-foreground text-xs">
            The business identity that appears on invoices, owner statements,
            and legal footers.
          </p>
        </div>
        {canEdit ? (
          <LoadingButton type="submit" loading={updateProfile.isPending}>
            Save Changes
          </LoadingButton>
        ) : null}
      </div>

      {/* One disabled fieldset rather than a `disabled` prop on sixteen inputs:
          it also blocks the fields from being submitted or tabbed into. */}
      <fieldset
        disabled={!canEdit}
        className="flex min-w-0 flex-col gap-6 border-0 p-0"
      >
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
                <Input {...form.register("companyName")} />
                <FieldError errors={[form.formState.errors.companyName]} />
              </Field>
              <Field>
                <FieldLabel>Display Name</FieldLabel>
                <Input {...form.register("displayName")} />
              </Field>
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input value={profile?.slug ?? ""} disabled />
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
              <Input {...form.register("addressLine1")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Address Line 2</FieldLabel>
              <Input {...form.register("addressLine2")} />
            </Field>
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input {...form.register("city")} />
            </Field>
            <Field>
              <FieldLabel>State</FieldLabel>
              <Input {...form.register("state")} />
            </Field>
            <Field>
              <FieldLabel>Country</FieldLabel>
              <Input {...form.register("country")} />
            </Field>
            <Field>
              <FieldLabel>PIN</FieldLabel>
              <Input {...form.register("pin")} />
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
              <Input {...form.register("pan")} />
            </Field>
            <Field>
              <FieldLabel>GSTIN</FieldLabel>
              <Input {...form.register("gstin")} />
            </Field>
            <Field>
              <FieldLabel>CIN (optional)</FieldLabel>
              <Input {...form.register("cin")} />
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
              <Input type="email" {...form.register("businessEmail")} />
              <FieldError errors={[form.formState.errors.businessEmail]} />
            </Field>
            <Field>
              <FieldLabel>Business Phone</FieldLabel>
              <Input {...form.register("businessPhone")} />
            </Field>
            <Field>
              <FieldLabel>Support Email</FieldLabel>
              <Input type="email" {...form.register("supportEmail")} />
              <FieldError errors={[form.formState.errors.supportEmail]} />
            </Field>
            <Field>
              <FieldLabel>Website</FieldLabel>
              <Input {...form.register("website")} />
            </Field>
          </div>
        </section>
      </fieldset>
    </form>
  );
}

/** Mirrors the form's four sections so the layout does not jump on load. */
function CompanyProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      {["identity", "address", "legal", "contact"].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
