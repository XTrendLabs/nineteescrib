import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@propertyos/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { Controller, useForm } from "react-hook-form";

import {
  memberTitles,
  type ProfileStepValues,
  profileStepSchema,
} from "../lib/onboarding-schema";

export function StepProfile({
  defaultValues,
  onSubmit,
}: {
  defaultValues: Partial<ProfileStepValues>;
  onSubmit: (values: ProfileStepValues) => Promise<void>;
}) {
  const feedback = useFeedback();

  const form = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: {
      organizationName: defaultValues.organizationName ?? "",
      title: defaultValues.title ?? "",
      phoneNumber: defaultValues.phoneNumber ?? "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      feedback.error(
        "Couldn't save your details",
        error instanceof Error ? error.message : undefined,
      );
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-display-sm">Tell us about your business</h1>
          <p className="text-balance text-muted-foreground text-sm">
            This sets up your organization on PropertyOS
          </p>
        </div>

        <Controller
          name="organizationName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="organizationName">
                Organization name
              </FieldLabel>
              <Input
                {...field}
                id="organizationName"
                placeholder="Sunrise Retreats"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="title">Your role</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="title" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {memberTitles.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="phoneNumber"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
              <PhoneInput
                {...field}
                id="phoneNumber"
                placeholder="98765 43210"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                We'll text a verification code to this number next.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
