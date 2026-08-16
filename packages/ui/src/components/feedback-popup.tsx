"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  getFeedbackState,
  hideFeedback,
  subscribeFeedback,
} from "@propertyos/ui/lib/feedback-store";
import { cn } from "@propertyos/ui/lib/utils";
import { CheckCircle2Icon, XCircleIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

function FeedbackPopup() {
  const state = useSyncExternalStore(
    subscribeFeedback,
    getFeedbackState,
    getFeedbackState,
  );

  const isSuccess = state.variant === "success";

  return (
    <DialogPrimitive.Root
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          hideFeedback();
        }
      }}
    >
      <AnimatePresence>
        {state.open && (
          <DialogPrimitive.Portal keepMounted>
            <DialogPrimitive.Backdrop
              render={
                <motion.div
                  key="feedback-backdrop"
                  className="fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              }
            />
            <DialogPrimitive.Popup
              render={
                <motion.div
                  key="feedback-popup"
                  className={cn(
                    "fixed top-1/2 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 border bg-background p-6 text-center shadow-lg",
                  )}
                  initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                />
              }
            >
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  isSuccess
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {isSuccess ? (
                  <CheckCircle2Icon className="size-6" />
                ) : (
                  <XCircleIcon className="size-6" />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <DialogPrimitive.Title className="font-medium text-base">
                  {state.title}
                </DialogPrimitive.Title>
                {state.message && (
                  <DialogPrimitive.Description className="text-muted-foreground text-sm">
                    {state.message}
                  </DialogPrimitive.Description>
                )}
              </div>

              <DialogPrimitive.Close className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export { FeedbackPopup };
