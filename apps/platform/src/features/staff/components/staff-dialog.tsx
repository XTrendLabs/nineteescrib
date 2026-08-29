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
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { EyeIcon, EyeOffIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useProperties } from "@/features/properties/api/use-properties";
import { DatePicker } from "@/shared/components/date-picker";
import { api } from "@/shared/lib/api-client";
import { useCreateStaff } from "../api/use-create-staff";
import { useUpdateStaff } from "../api/use-update-staff";
import { useUpdateStaffProperties } from "../api/use-update-staff-properties";
import {
  STAFF_GENDER_LABEL,
  STAFF_ROLE_LABEL,
  STAFF_STATUS_LABEL,
  type Staff,
  type StaffProperty,
  staffGenderValues,
  staffRoleValues,
  staffStatusValues,
} from "../lib/staff";
import {
  type StaffFormOutput,
  type StaffFormValues,
  staffFormSchema,
} from "../lib/staff-schema";

// Ambiguous characters (O/0, l/1/I) are left out so the password survives
// being read aloud or copied by hand.
const PASSWORD_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%";
const PASSWORD_LENGTH = 14;

/** Uses the crypto RNG -- this produces a real credential, not a placeholder. */
function generatePassword() {
  const bytes = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length],
  ).join("");
}

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
    // Access is granted at creation; an existing member's login is managed
    // separately rather than re-set from this form.
    platformAccess: false,
    password: "",
  };
}

/** Whether the assigned set differs from what the member already had. */
function hasPropertyChanges(before: StaffProperty[], after: string[]) {
  if (before.length !== after.length) return true;
  const previous = new Set(before.map((property) => property.id));
  return after.some((id) => !previous.has(id));
}

/**
 * Assignment changes are the part of a save people want confirmed, so they get
 * called out by name instead of a generic "saved".
 */
function describeSave(
  fullName: string,
  before: StaffProperty[] | undefined,
  after: string[] | undefined,
) {
  if (!before || !after) return `${fullName} has been saved.`;

  const previous = new Set(before.map((property) => property.id));
  const next = new Set(after);
  const added = after.filter((id) => !previous.has(id)).length;
  const removed = before.filter((property) => !next.has(property.id)).length;

  const changes: string[] = [];
  if (added > 0) {
    changes.push(
      `assigned to ${added} ${added === 1 ? "property" : "properties"}`,
    );
  }
  if (removed > 0) {
    changes.push(
      `removed from ${removed} ${removed === 1 ? "property" : "properties"}`,
    );
  }

  if (changes.length === 0) return `${fullName} has been saved.`;
  return `${fullName} has been ${changes.join(" and ")}.`;
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
  const updateProperties = useUpdateStaffProperties();
  const [tab, setTab] = useState("details");
  const isEditing = Boolean(staff);
  const mutation = isEditing ? updateStaff : createStaff;

  const { data: propertiesResponse, isPending: isLoadingProperties } =
    useProperties(hqOrganizationId);
  const properties = propertiesResponse?.data ?? [];

  const form = useForm<StaffFormValues, unknown, StaffFormOutput>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: toDefaultValues(staff),
  });

  const platformAccess = form.watch("platformAccess");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setTab("details");
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
        // Account fields belong to creation only, and assignments have their
        // own endpoint -- the details endpoint accepts neither.
        const {
          platformAccess: _a,
          password: _p,
          propertyIds,
          ...staffValues
        } = values;

        await updateStaff.mutateAsync({
          param: { id: staff.id },
          json: staffValues,
        });

        // Reconciling membership costs several queries, so it only runs when
        // the assignments actually moved.
        if (hasPropertyChanges(staff.properties, propertyIds)) {
          await updateProperties.mutateAsync({
            param: { id: staff.id },
            json: { propertyIds },
          });
        }
      } else {
        await createStaff.mutateAsync({
          json: {
            hqOrganizationId,
            ...values,
            // Only send a password when access was actually requested.
            password: values.platformAccess ? values.password : undefined,
          },
        });
      }

      await invalidate();
      feedback.success(
        isEditing ? "Staff updated" : "Staff added",
        describeSave(values.fullName, staff?.properties, values.propertyIds),
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

        <Tabs value={tab} onValueChange={setTab}>
          {/* Assignments save through their own endpoint, so they get their own
              tab rather than riding along with every detail edit. */}
          {isEditing && (
            <TabsList className="mx-4">
              <TabsTab value="details">Details</TabsTab>
              <TabsTab value="properties">Properties</TabsTab>
            </TabsList>
          )}

          <TabsPanel value="details">
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
                      <PhoneInput
                        id="staff-phone"
                        {...field}
                        placeholder="98765 43210"
                        aria-invalid={fieldState.invalid}
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
                      <FieldLabel htmlFor="staff-email">Email *</FieldLabel>
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="staff-role">Role *</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

                <Controller
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="staff-dob">Date of Birth</FieldLabel>
                      <DatePicker
                        id="staff-dob"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select"
                      />
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="staff-addr1">
                        Address Line 1
                      </FieldLabel>
                      <Input id="staff-addr1" {...field} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="staff-addr2">
                        Address Line 2
                      </FieldLabel>
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
                      <PhoneInput id="staff-emg-phone" {...field} />
                    </Field>
                  )}
                />
              </div>

              {/* Access is granted at creation. Editing an existing member's login
              is a separate concern from editing their staff record. */}
              {!isEditing && (
                <>
                  <Controller
                    control={form.control}
                    name="platformAccess"
                    render={({ field }) => (
                      <Field>
                        <Label className="flex items-start gap-2 font-normal">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                          <span>
                            <span className="font-medium text-xs">
                              Provide platform access
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              Creates a login so they can sign in to the
                              properties assigned above.
                            </span>
                          </span>
                        </Label>
                      </Field>
                    )}
                  />

                  {platformAccess && (
                    <Controller
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="staff-password">
                            Password *
                          </FieldLabel>
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <Input
                                id="staff-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                {...field}
                                placeholder="At least 8 characters"
                                aria-invalid={fieldState.invalid}
                                className="pr-8"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOffIcon className="size-3.5" />
                                ) : (
                                  <EyeIcon className="size-3.5" />
                                )}
                              </button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                field.onChange(generatePassword());
                                // Reveal it, since a generated password the user
                                // cannot read is of no use to them.
                                setShowPassword(true);
                              }}
                            >
                              <RefreshCwIcon className="size-3" />
                              Generate
                            </Button>
                          </div>
                          {fieldState.error && (
                            <FieldError>{fieldState.error.message}</FieldError>
                          )}
                        </Field>
                      )}
                    />
                  )}
                </>
              )}
            </FieldGroup>
          </TabsPanel>

          <TabsPanel value="properties">
            <FieldGroup className="px-4 pb-2">
              <Controller
                control={form.control}
                name="propertyIds"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Assigned Properties</FieldLabel>
                    {isLoadingProperties ? (
                      // Stay quiet until the list actually arrives — an empty
                      // array mid-fetch is not the same as having no properties.
                      <div className="flex flex-col gap-2 border p-3">
                        {["a", "b", "c"].map((key) => (
                          <Skeleton key={key} className="h-5" />
                        ))}
                      </div>
                    ) : properties.length === 0 ? (
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
          </TabsPanel>
        </Tabs>

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
