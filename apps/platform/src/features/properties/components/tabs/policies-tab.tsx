import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";

import { paiseToRupees, rupeesToPaise } from "../../lib/format";
import type { Policies, PropertyDetail } from "../../lib/mock-data";

const CANCELLATION_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "moderate", label: "Moderate" },
  { value: "strict", label: "Strict" },
  { value: "non_refundable", label: "Non-Refundable" },
];

const PET_OPTIONS = [
  { value: "allowed", label: "Allowed" },
  { value: "not_allowed", label: "Not Allowed" },
  { value: "on_request", label: "On Request" },
];

const SMOKING_OPTIONS = [
  { value: "allowed", label: "Allowed" },
  { value: "not_allowed", label: "Not Allowed" },
  { value: "designated", label: "Designated Areas" },
];

const EVENT_OPTIONS = [
  { value: "allowed", label: "Allowed" },
  { value: "not_allowed", label: "Not Allowed" },
  { value: "on_request", label: "On Request (with surcharge)" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

export function PoliciesTab({ property }: { property: PropertyDetail }) {
  const [policies, setPolicies] = useState<Policies>(property.policies);

  function update<K extends keyof Policies>(key: K, value: Policies[K]) {
    setPolicies((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Check-in Time">
          <Input
            type="time"
            value={policies.checkinTime}
            onChange={(e) => update("checkinTime", e.target.value)}
          />
        </Field>
        <Field label="Check-out Time">
          <Input
            type="time"
            value={policies.checkoutTime}
            onChange={(e) => update("checkoutTime", e.target.value)}
          />
        </Field>

        <Field label="Cancellation Policy">
          <Select
            value={policies.cancellationPolicy}
            onValueChange={(value) =>
              update(
                "cancellationPolicy",
                value as Policies["cancellationPolicy"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Cancellation Policy">
                {(value: unknown) =>
                  CANCELLATION_OPTIONS.find((o) => o.value === value)?.label ??
                  "Cancellation Policy"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CANCELLATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Cancellation Deadline (hours before check-in)">
          <Input
            type="number"
            value={policies.cancellationHours}
            onChange={(e) =>
              update("cancellationHours", Number(e.target.value))
            }
          />
        </Field>

        <Field label="Refund Percentage">
          <Input
            type="number"
            min={0}
            max={100}
            value={policies.refundPercentage}
            onChange={(e) => update("refundPercentage", Number(e.target.value))}
          />
        </Field>

        <Field label="Security Deposit (₹)">
          <Input
            type="number"
            value={paiseToRupees(policies.securityDepositPaise)}
            onChange={(e) =>
              update(
                "securityDepositPaise",
                rupeesToPaise(Number(e.target.value)),
              )
            }
          />
        </Field>

        <Field label="Pet Policy">
          <Select
            value={policies.petPolicy}
            onValueChange={(value) =>
              update("petPolicy", value as Policies["petPolicy"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pet Policy">
                {(value: unknown) =>
                  PET_OPTIONS.find((o) => o.value === value)?.label ??
                  "Pet Policy"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Smoking Policy">
          <Select
            value={policies.smokingPolicy}
            onValueChange={(value) =>
              update("smokingPolicy", value as Policies["smokingPolicy"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Smoking Policy">
                {(value: unknown) =>
                  SMOKING_OPTIONS.find((o) => o.value === value)?.label ??
                  "Smoking Policy"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SMOKING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Event Policy">
          <Select
            value={policies.eventPolicy}
            onValueChange={(value) =>
              update("eventPolicy", value as Policies["eventPolicy"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Event Policy">
                {(value: unknown) =>
                  EVENT_OPTIONS.find((o) => o.value === value)?.label ??
                  "Event Policy"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EVENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="House Rules">
        <textarea
          value={policies.houseRules}
          onChange={(e) => update("houseRules", e.target.value)}
          rows={4}
          className="w-full min-w-0 resize-none rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
        />
      </Field>

      <button
        type="button"
        onClick={() => update("idRequired", !policies.idRequired)}
        className="flex w-fit items-center gap-2 text-left text-xs"
      >
        <Checkbox checked={policies.idRequired} tabIndex={-1} />
        Require guest ID verification at booking/check-in
      </button>

      <div>
        <Button
          onClick={() =>
            toast.success("Policies saved", {
              description: `Policies updated for ${property.name}.`,
            })
          }
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
