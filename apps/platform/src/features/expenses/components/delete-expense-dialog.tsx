import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import type { Expense } from "../lib/expense";

export function DeleteExpenseDialog({
  expense,
  isPending = false,
  onOpenChange,
  onConfirm,
}: {
  expense: Expense | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expense: Expense) => void;
}) {
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
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (!expense) {
                return;
              }
              // The toast and the close now belong to the caller: it is the
              // one that knows whether the delete actually succeeded.
              onConfirm(expense);
            }}
          >
            {isPending ? "Deleting..." : "Delete Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
