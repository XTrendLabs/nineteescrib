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
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import { TimePicker } from "@propertyos/ui/components/time-picker";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/shared/lib/api-client";
import { useUpdateBusinessDetails } from "../api/use-update-business-details";
import {
  type BusinessDetailsValues,
  businessDetailsSchema,
} from "../lib/business-details-schema";
import type { Property } from "../lib/property";

function timeStringToDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
  return new Date(0, 0, 0, hours, minutes);
}

function dateToTimeString(date: Date | undefined): string {
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function toDefaultValues(
  property: Property,
  defaults: { ownerName?: string; contactPhone?: string },
): BusinessDetailsValues {
  return {
    ownerName: property.ownerName ?? defaults.ownerName ?? "",
    contactPhone: property.contactPhone ?? defaults.contactPhone ?? "",
    contactEmail: property.contactEmail ?? "",
    whatsappNumber: property.whatsappNumber ?? "",
    operationsOpenTime: property.operationsOpenTime ?? "",
    operationsCloseTime: property.operationsCloseTime ?? "",
  };
}

export function BusinessDetailsDialog({
  open,
  onOpenChange,
  property,
  defaultOwnerName,
  defaultContactPhone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  defaultOwnerName?: string;
  defaultContactPhone?: string;
}) {
  const defaults = {
    ownerName: defaultOwnerName,
    contactPhone: defaultContactPhone,
  };
  const updateBusinessDetails = useUpdateBusinessDetails();

  const form = useForm<BusinessDetailsValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: toDefaultValues(property, defaults),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(property, defaults));
      updateBusinessDetails.reset();
    }
  }, [open]);

  const handleSubmit = form.handleSubmit((values) => {
    updateBusinessDetails.mutate(
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
          <DialogTitle>Business Details</DialogTitle>
          <DialogDescription>
            Owner, contact, and operations info for this property. Invoicing and
            GST can be set up later from the Taxes & Billing tab.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <FieldGroup>
            <Controller
              name="ownerName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ownerName">Owner Name *</FieldLabel>
                  <Input
                    {...field}
                    id="ownerName"
                    placeholder="Jane Doe"
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
                name="contactPhone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="contactPhone">
                      Contact Phone *
                    </FieldLabel>
                    <PhoneInput
                      {...field}
                      id="contactPhone"
                      placeholder="98765 43210"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="contactEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="contactEmail">
                      Contact Email *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="contactEmail"
                      type="email"
                      placeholder="owner@example.com"
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
              name="whatsappNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="whatsappNumber">
                    WhatsApp Number *
                  </FieldLabel>
                  <PhoneInput
                    {...field}
                    id="whatsappNumber"
                    placeholder="98765 43210"
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
                name="operationsOpenTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Opens At *</FieldLabel>
                    <TimePicker
                      date={timeStringToDate(field.value)}
                      setDate={(date) => field.onChange(dateToTimeString(date))}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="operationsCloseTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Closes At *</FieldLabel>
                    <TimePicker
                      date={timeStringToDate(field.value)}
                      setDate={(date) => field.onChange(dateToTimeString(date))}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {updateBusinessDetails.isError && (
              <p className="text-destructive text-xs">
                Something went wrong saving these details. Please try again.
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={updateBusinessDetails.isPending}
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
