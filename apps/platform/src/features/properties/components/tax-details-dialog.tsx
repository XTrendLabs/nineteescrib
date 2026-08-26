import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/shared/lib/api-client";
import { useUpdateTaxDetails } from "../api/use-update-tax-details";
import type { Property } from "../lib/property";
import {
  type TaxDetailsValues,
  taxDetailsSchema,
} from "../lib/tax-details-schema";

function toDefaultValues(property: Property): TaxDetailsValues {
  return {
    gstNumber: property.gstNumber ?? "",
    panNumber: property.panNumber ?? "",
    invoicePrefix: property.invoicePrefix ?? "",
    billingAddress: property.billingAddress ?? "",
    bankAccountHolderName: property.bankAccountHolderName ?? "",
    bankAccountNumber: property.bankAccountNumber ?? "",
    bankIfscCode: property.bankIfscCode ?? "",
    bankName: property.bankName ?? "",
  };
}

export function TaxDetailsDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}) {
  const updateTaxDetails = useUpdateTaxDetails();

  const form = useForm<TaxDetailsValues>({
    resolver: zodResolver(taxDetailsSchema),
    defaultValues: toDefaultValues(property),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(property));
      updateTaxDetails.reset();
    }
  }, [open, updateTaxDetails.reset, property, form.reset]);

  const handleSubmit = form.handleSubmit((values) => {
    updateTaxDetails.mutate(
      { param: { id: property.id }, json: values },
      {
        onSuccess: () => {
          api.api.platform.properties[":slug"].$get.invalidate({
            param: { slug: property.slug },
          });
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Taxes & Billing</DialogTitle>
          <DialogDescription>
            GST, PAN, invoicing, and payout bank details for this property.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="gstNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gstNumber">GST Number</FieldLabel>
                    <Input
                      {...field}
                      id="gstNumber"
                      placeholder="22AAAAA0000A1Z5"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="panNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="panNumber">PAN Number</FieldLabel>
                    <Input
                      {...field}
                      id="panNumber"
                      placeholder="AAAAA0000A"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="invoicePrefix"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoicePrefix">
                    Invoice Prefix
                  </FieldLabel>
                  <Input
                    {...field}
                    id="invoicePrefix"
                    placeholder="SV-INV"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="billingAddress"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="billingAddress">
                    Billing Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="billingAddress"
                    placeholder="123 Beach Road, Goa, India"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="bankAccountHolderName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bankAccountHolderName">
                      Account Holder Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="bankAccountHolderName"
                      placeholder="Jane Doe"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="bankName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bankName">Bank Name</FieldLabel>
                    <Input
                      {...field}
                      id="bankName"
                      placeholder="HDFC Bank"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="bankAccountNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bankAccountNumber">
                      Account Number
                    </FieldLabel>
                    <Input
                      {...field}
                      id="bankAccountNumber"
                      placeholder="1234567890"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="bankIfscCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bankIfscCode">IFSC Code</FieldLabel>
                    <Input
                      {...field}
                      id="bankIfscCode"
                      placeholder="HDFC0000123"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {updateTaxDetails.isError && (
              <p className="text-destructive text-xs">
                Something went wrong saving these details. Please try again.
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={updateTaxDetails.isPending}
              loadingText="Saving…"
            >
              Save
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
