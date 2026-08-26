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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/shared/lib/api-client";
import { useUpdatePropertyDetails } from "../api/use-update-property-details";
import type { Property } from "../lib/property";
import {
  type PropertyDetailsValues,
  propertyDetailsSchema,
  propertyDetailsTypeValues,
} from "../lib/property-details-schema";

const TYPE_LABEL: Record<(typeof propertyDetailsTypeValues)[number], string> = {
  villa: "Villa",
  apartment: "Apartment",
  hotel: "Hotel",
  homestay: "Homestay",
  other: "Other",
};

function toDefaultValues(property: Property): PropertyDetailsValues {
  const propertyType = propertyDetailsTypeValues.includes(
    property.propertyType as (typeof propertyDetailsTypeValues)[number],
  )
    ? (property.propertyType as (typeof propertyDetailsTypeValues)[number])
    : "other";

  return {
    name: property.name,
    propertyType,
    addressLine1: property.addressLine1 ?? "",
    city: property.city ?? "",
    state: property.state ?? "",
    country: property.country ?? "",
  };
}

export function PropertyDetailsDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}) {
  const updatePropertyDetails = useUpdatePropertyDetails();

  const form = useForm<PropertyDetailsValues>({
    resolver: zodResolver(propertyDetailsSchema),
    defaultValues: toDefaultValues(property),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(property));
      updatePropertyDetails.reset();
    }
  }, [open, updatePropertyDetails.reset, property, form.reset]);

  const handleSubmit = form.handleSubmit((values) => {
    updatePropertyDetails.mutate(
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
          <DialogTitle>Property Details</DialogTitle>
          <DialogDescription>
            Name, type, and address for this property.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      placeholder="Sunrise Villa"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="propertyType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="propertyType">Type</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyDetailsTypeValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="addressLine1"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
                  <Input
                    {...field}
                    id="addressLine1"
                    placeholder="123 Beach Road"
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
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input
                      {...field}
                      id="city"
                      placeholder="Goa"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="state">State</FieldLabel>
                    <Input
                      {...field}
                      id="state"
                      placeholder="Goa"
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
              name="country"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <Input
                    {...field}
                    id="country"
                    placeholder="India"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {updatePropertyDetails.isError && (
              <p className="text-destructive text-xs">
                Something went wrong saving these details. Please try again.
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={updatePropertyDetails.isPending}
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
