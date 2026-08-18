import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Progress } from "@propertyos/ui/components/progress";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { CheckIcon, TagIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import {
  MOCK_AVAILABLE_PLANS,
  MOCK_FEATURE_FLAGS,
  MOCK_PLAN,
  MOCK_USAGE_LIMITS,
} from "@/features/settings/lib/mock-data";

export function PlanUsageSection() {
  const feedback = useFeedback();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Plan &amp; Usage</h2>
        <p className="text-muted-foreground text-xs">
          Your subscription plan, usage limits, and gated features.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Current Plan
        </h3>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-medium text-sm">
                <TagIcon className="size-4 text-primary" />
                {MOCK_PLAN.name} — {MOCK_PLAN.price}
              </div>
              <p className="text-muted-foreground text-xs">
                Billing Cycle: {MOCK_PLAN.billingCycle} | Next Renewal:{" "}
                {MOCK_PLAN.nextRenewal}
              </p>
              <Badge variant="solid-success" className="w-fit">
                {MOCK_PLAN.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setChangePlanOpen(true)}>
                Change Plan
              </Button>
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Usage Limits
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-4">
            {MOCK_USAGE_LIMITS.map((usage) => (
              <div key={usage.resource} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span>{usage.resource}</span>
                  <span className="text-muted-foreground">
                    {usage.used} / {usage.limit}
                  </span>
                </div>
                <Progress value={(usage.used / usage.limit) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Feature Flags
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-2">
            {MOCK_FEATURE_FLAGS.map((flag) => (
              <div
                key={flag.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  {flag.enabled ? (
                    <CheckIcon className="size-3.5 text-success" />
                  ) : (
                    <XIcon className="size-3.5 text-muted-foreground" />
                  )}
                  {flag.label}
                </span>
                {!flag.enabled && flag.upgradeTier && (
                  <span className="text-muted-foreground">
                    Upgrade to {flag.upgradeTier}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Compare plans and choose the one that fits your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {MOCK_AVAILABLE_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.name === MOCK_PLAN.name.replace("Plan", "")
                    ? "ring-2 ring-primary"
                    : undefined
                }
              >
                <CardHeader className="flex-row items-center justify-between px-3">
                  <CardTitle>{plan.name}</CardTitle>
                  <span className="text-muted-foreground text-xs">
                    {plan.price}
                  </span>
                </CardHeader>
                <CardContent className="flex items-center justify-between px-3">
                  <span className="text-muted-foreground text-xs">
                    Up to {plan.properties} properties
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      feedback.success(
                        "Plan change requested",
                        `Switching to ${plan.name} plan.`,
                      );
                      setChangePlanOpen(false);
                    }}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel plan"
        description="Your subscription will remain active until the end of the current billing cycle, then all properties will be downgraded to read-only."
        confirmLabel="Cancel Plan"
        onConfirm={() =>
          feedback.success(
            "Plan cancellation scheduled",
            "Your plan will end at the next renewal date.",
          )
        }
      />
    </div>
  );
}
