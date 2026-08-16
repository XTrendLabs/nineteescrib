import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@propertyos/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { Building2, Home, Hotel, LandPlot, Warehouse } from "lucide-react";
import { motion } from "motion/react";
import { Controller, useForm } from "react-hook-form";

import {
  type PropertyStepValues,
  propertyStepSchema,
  propertyTypeValues,
} from "../lib/onboarding-schema";

const PROPERTY_TYPE_META: Record<
  (typeof propertyTypeValues)[number],
  { label: string; icon: React.ReactNode }
> = {
  villa: { label: "Villa", icon: <Home className="size-5" /> },
  apartment: { label: "Apartment", icon: <Building2 className="size-5" /> },
  hotel: { label: "Hotel", icon: <Hotel className="size-5" /> },
  homestay: { label: "Homestay", icon: <Warehouse className="size-5" /> },
  other: { label: "Other", icon: <LandPlot className="size-5" /> },
};

export function StepProperty({
  onSubmit,
  onSkip,
}: {
  onSubmit: (values: PropertyStepValues) => Promise<void>;
  onSkip: () => void;
}) {
  const feedback = useFeedback();

  const form = useForm<PropertyStepValues>({
    resolver: zodResolver(propertyStepSchema),
    defaultValues: {
      name: "",
      propertyType: "villa",
      addressLine1: "",
      city: "",
      state: "",
      country: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      feedback.error(
        "Couldn't add property",
        error instanceof Error ? error.message : undefined,
      );
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-display-sm">Add your first property</h1>
          <p className="text-balance text-muted-foreground text-sm">
            You can always add more, or skip this for now
          </p>
        </div>

        <Controller
          name="propertyType"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Property type</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {propertyTypeValues.map((type) => {
                  const meta = PROPERTY_TYPE_META[type];
                  const selected = field.value === type;
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 border p-3 text-xs transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {meta.icon}
                      {meta.label}
                    </motion.button>
                  );
                })}
              </div>
            </Field>
          )}
        />

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="propertyName">Property name</FieldLabel>
              <Input
                {...field}
                id="propertyName"
                placeholder="Sunrise Villa"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? "Creating..." : "Finish"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
