"use client";

import { cn } from "@propertyos/ui/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export type StepperStep = {
  label: string;
  description?: string;
  icon: ReactNode;
};

type StepStatus = "done" | "active" | "upcoming";

function StepperCircle({
  step,
  status,
}: {
  step: StepperStep;
  status: StepStatus;
}) {
  return (
    <motion.div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center border",
        status === "done" &&
          "border-primary bg-primary text-primary-foreground",
        status === "active" && "border-primary bg-background text-primary",
        status === "upcoming" &&
          "border-border bg-background text-muted-foreground",
      )}
      animate={{ scale: status === "active" ? 1.08 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {status === "done" ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Check className="size-4" />
        </motion.div>
      ) : (
        step.icon
      )}
      {status === "active" && (
        <motion.span
          className="absolute inset-0 border border-primary"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{
            duration: 1.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      )}
    </motion.div>
  );
}

function HorizontalStepper({
  steps,
  currentStep,
}: {
  steps: StepperStep[];
  currentStep: number;
}) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const status: StepStatus =
          stepNumber < currentStep
            ? "done"
            : stepNumber === currentStep
              ? "active"
              : "upcoming";

        return (
          <div
            key={step.label}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-2">
              <StepperCircle step={step} status={status} />
              <span
                className={cn(
                  "text-center font-medium text-xs",
                  status === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="relative mx-2 -mt-6 h-px flex-1 bg-border">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={false}
                  animate={{ width: stepNumber < currentStep ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerticalStepper({
  steps,
  currentStep,
}: {
  steps: StepperStep[];
  currentStep: number;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const status: StepStatus =
          stepNumber < currentStep
            ? "done"
            : stepNumber === currentStep
              ? "active"
              : "upcoming";

        return (
          <div
            key={step.label}
            className={cn(
              "flex flex-1 gap-4",
              index === steps.length - 1 && "flex-none",
            )}
          >
            <div className="flex flex-col items-center">
              <StepperCircle step={step} status={status} />
              {index < steps.length - 1 && (
                <div className="relative my-1 w-px flex-1 bg-border">
                  <motion.div
                    className="absolute inset-x-0 top-0 bg-primary"
                    initial={false}
                    animate={{
                      height: stepNumber < currentStep ? "100%" : "0%",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  />
                </div>
              )}
            </div>
            <div>
              <p
                className={cn(
                  "pt-2 font-medium text-sm",
                  status === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
}: {
  steps: StepperStep[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return <VerticalStepper steps={steps} currentStep={currentStep} />;
  }

  return <HorizontalStepper steps={steps} currentStep={currentStep} />;
}
