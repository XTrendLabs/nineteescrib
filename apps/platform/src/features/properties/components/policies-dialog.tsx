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
import { TimePicker } from "@propertyos/ui/components/time-picker";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/shared/lib/api-client";
import { useUpdatePolicies } from "../api/use-update-policies";
import { type PoliciesValues, policiesSchema } from "../lib/policies-schema";
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

function toDefaultValues(property: Property): PoliciesValues {
  return {
    checkInTime: property.checkInTime ?? "",
    checkOutTime: property.checkOutTime ?? "",
    minStayNights: property.minStayNights ?? undefined,
    maxStayNights: property.maxStayNights ?? undefined,
  };
}

export function PoliciesDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}) {
  const updatePolicies = useUpdatePolicies();

  const form = useForm<PoliciesValues>({
    resolver: zodResolver(policiesSchema),
    defaultValues: toDefaultValues(property),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(property));
      updatePolicies.reset();
    }
  }, [open, updatePolicies.reset, property, form.reset]);

  const handleSubmit = form.handleSubmit((values) => {
    updatePolicies.mutate(
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
          <DialogTitle>Check-in & Stay Limits</DialogTitle>
          <DialogDescription>
            Check-in/check-out times and minimum/maximum stay length for this
            property.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="checkInTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Check-in Time *</FieldLabel>
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
                name="checkOutTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Check-out Time *</FieldLabel>
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

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="minStayNights"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="minStayNights">
                      Min Stay (nights)
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="minStayNights"
                      type="number"
                      min={1}
                      placeholder="1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="maxStayNights"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="maxStayNights">
                      Max Stay (nights)
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="maxStayNights"
                      type="number"
                      min={1}
                      placeholder="30"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {updatePolicies.isError && (
              <p className="text-destructive text-xs">
                Something went wrong saving these details. Please try again.
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={updatePolicies.isPending}
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
