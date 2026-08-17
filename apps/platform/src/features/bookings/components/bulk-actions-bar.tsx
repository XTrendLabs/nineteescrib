import { Button } from "@propertyos/ui/components/button";
import { DoorClosedIcon, DownloadIcon, PrinterIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function BulkActionsBar({
  count,
  onClear,
}: {
  count: number;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 border bg-popover px-4 py-2.5 shadow-lg ring-1 ring-foreground/10"
        >
          <span className="text-xs">
            <span className="font-medium">{count}</span> selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm">
            <DownloadIcon />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm">
            <DoorClosedIcon />
            Bulk Checkout
          </Button>
          <Button variant="ghost" size="sm">
            <PrinterIcon />
            Print Reg. Cards
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="icon-sm" onClick={onClear}>
            <XIcon />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
