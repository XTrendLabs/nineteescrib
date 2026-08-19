import { Button } from "@propertyos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import {
  HistoryIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  WalletIcon,
} from "lucide-react";
import type { Expense } from "../lib/mock-data";

export function ExpenseRowActions({
  expense,
  onRecordPayment,
  onViewHistory,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onRecordPayment: (expense: Expense) => void;
  onViewHistory: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <MoreVerticalIcon />
            <span className="sr-only">Actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {expense.status !== "paid" && (
          <DropdownMenuItem onClick={() => onRecordPayment(expense)}>
            <WalletIcon />
            Record Payment
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onViewHistory(expense)}>
          <HistoryIcon />
          View History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <PencilIcon />
          Edit Expense
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(expense)}
        >
          <TrashIcon />
          Delete Expense
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
