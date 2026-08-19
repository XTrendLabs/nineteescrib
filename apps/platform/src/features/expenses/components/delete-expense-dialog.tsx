import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import type { Expense } from "../lib/mock-data";

export function DeleteExpenseDialog({
  expense,
  onOpenChange,
  onConfirm,
}: {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expense: Expense) => void;
}) {
  const feedback = useFeedback();

  return (
    <Dialog open={expense !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            {expense
              ? `This will permanently remove "${expense.title}" (${expense.ref}) and its payment ledger. This action cannot be undone.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!expense) {
                return;
              }
              onConfirm(expense);
              feedback.success(
                "Expense deleted",
                `${expense.ref} has been removed.`,
              );
              onOpenChange(false);
            }}
          >
            Delete Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
