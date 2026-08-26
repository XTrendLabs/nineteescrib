import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
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
import { Label } from "@propertyos/ui/components/label";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { useProperties } from "@/features/properties/api/use-properties";
import { api } from "@/shared/lib/api-client";
import { useCreateStaff } from "../api/use-create-staff";
import { useUpdateStaff } from "../api/use-update-staff";
import {
  STAFF_GENDER_LABEL,
  STAFF_ROLE_LABEL,
  STAFF_STATUS_LABEL,
  type Staff,
  staffGenderValues,
  staffRoleValues,
  staffStatusValues,
} from "../lib/staff";
import {
  type StaffFormOutput,
  type StaffFormValues,
  staffFormSchema,
} from "../lib/staff-schema";

function toDefaultValues(staff: Staff | undefined): StaffFormValues {
  return {
    fullName: staff?.fullName ?? "",
    phone: staff?.phone ?? "",
    email: staff?.email ?? "",
    role: (staff?.role as StaffFormValues["role"]) ?? "caretaker",
    status: (staff?.status as StaffFormValues["status"]) ?? "active",
    dateOfBirth: staff?.dateOfBirth ?? "",
    gender: (staff?.gender as StaffFormValues["gender"]) ?? undefined,
    addressLine1: staff?.addressLine1 ?? "",
    addressLine2: staff?.addressLine2 ?? "",
    city: staff?.city ?? "",
    state: staff?.state ?? "",
    pinCode: staff?.pinCode ?? "",
    emergencyName: staff?.emergencyName ?? "",
    emergencyPhone: staff?.emergencyPhone ?? "",
    propertyIds: staff?.properties.map((p) => p.id) ?? [],
  };
}

export function StaffDialog({
  open,
  onOpenChange,
  hqOrganizationId,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hqOrganizationId: string;
  staff?: Staff;
}) {
  const feedback = useFeedback();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const isEditing = Boolean(staff);
  const mutation = isEditing ? updateStaff : createStaff;

  const { data: propertiesResponse } = useProperties(hqOrganizationId);
  const properties = propertiesResponse?.data ?? [];

  const form = useForm<StaffFormValues, unknown, StaffFormOutput>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: toDefaultValues(staff),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(staff));
      mutation.reset();
    }
  }, [open, staff, mutation.reset, form.reset]);

  function invalidate() {
    // The profile page reads a single member, so refresh that entry too.
    return Promise.all([
      api.api.platform.staff.$get.invalidate({
        query: { hqOrganizationId },
      }),
      staff
        ? api.api.platform.staff[":id"].$get.invalidate({
            param: { id: staff.id },
          })
        : undefined,
    ]);
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (staff) {
        await updateStaff.mutateAsync({
          param: { id: staff.id },
          json: values,
        });
      } else {
        await createStaff.mutateAsync({
          json: { hqOrganizationId, ...values },
        });
      }

      await invalidate();
      feedback.success(
        isEditing ? "Staff updated" : "Staff added",
        `${values.fullName} has been saved.`,
      );
      onOpenChange(false);
    } catch {
      feedback.error(
        "Couldn't save staff member",
        "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Staff Member" : "Add Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this staff member's details and property access."
              : "Add a staff member and assign the properties they work at."}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="px-4 pb-2">
          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="staff-name">Full Name *</FieldLabel>
                <Input
                  id="staff-name"
                  {...field}
                  placeholder="e.g. Sagar Patil"
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="staff-phone">Phone *</FieldLabel>
                  <Input
                    id="staff-phone"
                    {...field}
                    placeholder="+91 98765 43210"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="staff-email">Email</FieldLabel>
                  <Input
                    id="staff-email"
                    type="email"
                    {...field}
                    placeholder="name@example.com"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-role">Role *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="staff-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoleValues.map((role) => (
                        <SelectItem key={role} value={role}>
                          {STAFF_ROLE_LABEL[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-status">Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="staff-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staffStatusValues.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STAFF_STATUS_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-gender">Gender</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="staff-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffGenderValues.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {STAFF_GENDER_LABEL[gender]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="staff-dob">Date of Birth</FieldLabel>
                <Input id="staff-dob" type="date" {...field} />
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-addr1">Address Line 1</FieldLabel>
                  <Input id="staff-addr1" {...field} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-addr2">Address Line 2</FieldLabel>
                  <Input id="staff-addr2" {...field} />
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Controller
              control={form.control}
              name="city"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-city">City</FieldLabel>
                  <Input id="staff-city" {...field} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="state"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-state">State</FieldLabel>
                  <Input id="staff-state" {...field} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="pinCode"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-pin">PIN Code</FieldLabel>
                  <Input id="staff-pin" {...field} />
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="emergencyName"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-emg-name">
                    Emergency Contact
                  </FieldLabel>
                  <Input id="staff-emg-name" {...field} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="emergencyPhone"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-emg-phone">
                    Emergency Phone
                  </FieldLabel>
                  <Input id="staff-emg-phone" {...field} />
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="propertyIds"
            render={({ field }) => (
              <Field>
                <FieldLabel>Assigned Properties</FieldLabel>
                {properties.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No properties yet. Create one first to assign access.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 border p-3">
                    {properties.map((property) => (
                      <Label
                        key={property.id}
                        className="flex items-center gap-2 font-normal"
                      >
                        <Checkbox
                          checked={field.value.includes(property.id)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, property.id]
                                : field.value.filter(
                                    (id) => id !== property.id,
                                  ),
                            );
                          }}
                        />
                        {property.name}
                      </Label>
                    ))}
                  </div>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={mutation.isPending}
            onClick={() => handleSubmit()}
          >
            {isEditing ? "Save Changes" : "Add Staff"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
