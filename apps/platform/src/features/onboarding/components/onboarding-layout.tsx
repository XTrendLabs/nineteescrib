import { Stepper, type StepperStep } from "@propertyos/ui/components/stepper";
import {
  Building2,
  GalleryVerticalEnd,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { FeatureShowcase } from "./feature-showcase";

const STEPS: StepperStep[] = [
  {
    label: "Your details",
    description: "Organization, role, and phone number",
    icon: <UserRound className="size-4" />,
  },
  {
    label: "Verify phone",
    description: "Confirm the number with a code",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    label: "Add property",
    description: "Your first place, or skip for now",
    icon: <Building2 className="size-4" />,
  },
];

export function OnboardingLayout({
  step,
  children,
}: {
  step: number;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-10 p-6 md:p-10">
        <a href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-6 items-center justify-center rounded-none bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          propertyos
        </a>

        <div className="flex flex-1 items-center gap-10">
          <div className="hidden h-full max-h-[75%] shrink-0 self-center sm:block">
            <Stepper steps={STEPS} currentStep={step} orientation="vertical" />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <FeatureShowcase />
      </div>
    </div>
  );
}
