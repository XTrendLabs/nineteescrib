import { Button } from "@propertyos/ui/components/button";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useHasPermission } from "@/features/auth/lib/use-permission";
import { TablePagination } from "@/features/bookings/components/table-pagination";
import { useCreateExpense } from "@/features/expenses/api/use-create-expense";
import { useDeleteExpense } from "@/features/expenses/api/use-delete-expense";
import { useExpenses } from "@/features/expenses/api/use-expenses";
import { useRecordPayment } from "@/features/expenses/api/use-record-payment";
import { useUpdateExpense } from "@/features/expenses/api/use-update-expense";
import { useVendors } from "@/features/expenses/api/use-vendors";
import { AddVendorDialog } from "@/features/expenses/components/add-vendor-dialog";
import { DeleteExpenseDialog } from "@/features/expenses/components/delete-expense-dialog";
import { ExpenseHistoryDrawer } from "@/features/expenses/components/expense-history-drawer";
import { ExpensesTable } from "@/features/expenses/components/expenses-table";
import {
  DEFAULT_EXPENSE_FILTERS,
  FilterToolbar,
} from "@/features/expenses/components/filter-toolbar";
import {
  type FormState,
  LogExpenseDialog,
} from "@/features/expenses/components/log-expense-dialog";
import { uploadReceiptFile } from "@/features/expenses/components/receipt-manager";
import { RecordPaymentDialog } from "@/features/expenses/components/record-payment-dialog";
import { SummaryBand } from "@/features/expenses/components/summary-band";
import { VendorDirectory } from "@/features/expenses/components/vendor-directory";
import {
  type Expense,
  type HeldReceipt,
  HQ_SHARED_ID,
  normalizeCategory,
} from "@/features/expenses/lib/expense";
import { computeGst, percentToBps } from "@/features/expenses/lib/gst";
import type { Vendor } from "@/features/expenses/lib/vendor";
import { useProperties } from "@/features/properties/api/use-properties";
import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/expenses/")({
  component: RouteComponent,
});

/** Rupees as typed into a form, to whole paise. */
function toPaise(value: string): number {
  return Math.round((Number(value) || 0) * 100);
}

function RouteComponent() {
  const feedback = useFeedback();
  const { activeScopeId } = useActiveHq();

  const {
    data: expenseResponse,
    isLoading: expensesLoading,
    isFetching: expensesFetching,
  } = useExpenses(activeScopeId);
  const expenses = (expenseResponse?.data ?? []) as unknown as Expense[];

  const { data: vendorResponse, isLoading: vendorsLoading } =
    useVendors(activeScopeId);
  const vendors = (vendorResponse?.data ?? []) as unknown as Vendor[];

  const { data: propertyResponse } = useProperties(activeScopeId);
  const properties = useMemo(
    () =>
      (
        (propertyResponse?.data ?? []) as unknown as Array<{
          id: string;
          name: string;
        }>
      ).map((p) => ({ id: p.id, name: p.name })),
    [propertyResponse],
  );

  // Curating vendors is a management call; logging spend is open to everyone.
  const canManageVendors = useHasPermission("vendor", "create");

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const recordPayment = useRecordPayment();

  const [filters, setFilters] = useState(DEFAULT_EXPENSE_FILTERS);
  const [tab, setTab] = useState("expenses");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [historyExpense, setHistoryExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [addVendorOpen, setAddVendorOpen] = useState(false);

  /** Refetches the list every mutation invalidates. */
  function invalidateExpenses() {
    api.api.platform.expenses.$get.invalidate({
      query: { activeOrganizationId: activeScopeId ?? "" },
    });
  }

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (
        filters.propertyId !== "all" &&
        expense.propertyId !== filters.propertyId
      ) {
        return false;
      }
      if (
        filters.category !== "all" &&
        normalizeCategory(expense.category) !== filters.category
      ) {
        return false;
      }
      if (filters.status !== "all" && expense.status !== filters.status) {
        return false;
      }
      if (
        search &&
        !expense.title.toLowerCase().includes(search) &&
        !(expense.vendorName?.toLowerCase().includes(search) ?? false) &&
        !expense.ref.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [expenses, filters]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const summary = useMemo(() => {
    const totalPaise = expenses.reduce((s, e) => s + e.totalAmountPaise, 0);
    const paidPaise = expenses.reduce((s, e) => s + e.amountPaidPaise, 0);
    const pendingPaise = totalPaise - paidPaise;
    const ownerDeductedPaise = expenses
      .filter((e) => e.isOwnerDeductible)
      .reduce((s, e) => s + e.amountPaidPaise, 0);
    return { totalPaise, paidPaise, pendingPaise, ownerDeductedPaise };
  }, [expenses]);

  function openLogDrawer(expense: Expense | null) {
    setEditingExpense(expense);
    setLogDrawerOpen(true);
  }

  /**
   * The fields shared by create and update, mapped out of the form.
   *
   * The amount box holds the base or the gross depending on the GST mode, so
   * the payable total is always the computed one -- never the raw input.
   */
  function detailsFromForm(form: FormState) {
    const gstRateBps = percentToBps(form.gstRate);
    const gst = computeGst(toPaise(form.amount), gstRateBps, form.gstMode);

    return {
      title: form.title.trim(),
      category: form.category,
      // The picker's sentinel means "no property"; the API takes null.
      organizationId: form.propertyId === HQ_SHARED_ID ? null : form.propertyId,
      vendorId: form.vendorId || null,
      totalAmountPaise: gst.totalPaise,
      expenseDate: form.expenseDate,
      dueDate: form.dueDate,
      isOwnerDeductible: form.isOwnerDeductible,
      taxAmountPaise: gst.gstPaise,
      gstRateBps,
      gstMode: form.gstMode,
      vendorGstin: form.vendorGstin,
      itcClaimable: form.itcClaimable,
      notes: form.notes,
    };
  }

  /**
   * Uploads the receipts held while the expense was being created.
   *
   * Failures are reported but do not undo the expense: the cost is recorded
   * either way, and a missing attachment can be added from the edit dialog.
   */
  async function uploadHeldReceipts(expenseId: string, held: HeldReceipt[]) {
    const failed: string[] = [];
    for (const item of held) {
      try {
        await uploadReceiptFile(expenseId, item.file);
      } catch {
        failed.push(item.file.name);
      }
    }

    if (failed.length > 0) {
      feedback.error(
        "Expense saved, but some receipts failed",
        `Couldn't upload ${failed.join(", ")}. Add them by editing the expense.`,
      );
    }
  }

  function handleSaveExpense(
    form: FormState,
    editing: Expense | null,
    receipts: HeldReceipt[] = [],
  ) {
    if (editing) {
      updateExpense.mutate(
        { param: { id: editing.id }, json: detailsFromForm(form) },
        {
          onSuccess: () => {
            invalidateExpenses();
            setLogDrawerOpen(false);
            feedback.success(
              "Expense updated",
              `${form.title.trim()} has been updated.`,
            );
          },
          onError: (error) => {
            feedback.error(
              "Couldn't update expense",
              getApiErrorMessage(error, "Something went wrong. Try again."),
            );
          },
        },
      );
      return;
    }

    // "paid" settles the whole amount; "partial" takes what was entered. Both
    // travel with the expense so settling costs no second round-trip.
    const details = detailsFromForm(form);
    const initialAmountPaise =
      form.initialStatus === "paid"
        ? // The payable total including GST, not the base that was typed.
          details.totalAmountPaise
        : form.initialStatus === "partial"
          ? toPaise(form.initialAmountPaid)
          : 0;

    createExpense.mutate(
      {
        json: {
          ...details,
          initialPayment:
            initialAmountPaise > 0
              ? {
                  amountPaise: initialAmountPaise,
                  method: form.paymentMethod,
                  paidAt: form.paymentDate,
                  referenceId: form.referenceId,
                }
              : undefined,
        },
      },
      {
        onSuccess: async (response) => {
          // The receipts were held back until there was an id to attach them
          // to, so they go up now, before the list is refetched.
          const created = (response as { data?: { id?: string } } | undefined)
            ?.data;
          if (created?.id && receipts.length > 0) {
            await uploadHeldReceipts(created.id, receipts);
          }

          invalidateExpenses();
          setLogDrawerOpen(false);
          feedback.success(
            "Expense logged",
            `${form.title.trim()} has been added.`,
          );
        },
        onError: (error) => {
          feedback.error(
            "Couldn't log expense",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div>
        <h1 className="text-display-md">Expenses Management</h1>
        <p className="text-muted-foreground text-sm">
          Track property and HQ-shared expenses, vendor payments, and owner
          deductions.
        </p>
      </div>

      <SummaryBand
        totalPaise={summary.totalPaise}
        paidPaise={summary.paidPaise}
        pendingPaise={summary.pendingPaise}
        ownerDeductedPaise={summary.ownerDeductedPaise}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTab value="expenses">Expenses</TabsTab>
            <TabsTab value="vendors">Vendors</TabsTab>
          </TabsList>
          {tab === "expenses" ? (
            <Button onClick={() => openLogDrawer(null)}>
              <PlusIcon />
              Log Expense
            </Button>
          ) : canManageVendors ? (
            <Button onClick={() => setAddVendorOpen(true)}>
              <PlusIcon />
              Add Vendor
            </Button>
          ) : null}
        </div>

        <TabsPanel value="expenses">
          <div className="flex flex-col gap-4">
            <FilterToolbar
              filters={filters}
              properties={properties}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
            <ExpensesTable
              expenses={paginated}
              isLoading={expensesLoading || expensesFetching}
              hasAny={expenses.length > 0}
              onRecordPayment={setPaymentExpense}
              onViewHistory={setHistoryExpense}
              onEdit={openLogDrawer}
              onDelete={setExpenseToDelete}
            />
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </TabsPanel>

        <TabsPanel value="vendors">
          <VendorDirectory
            vendors={vendors}
            expenses={expenses}
            isLoading={vendorsLoading}
          />
        </TabsPanel>
      </Tabs>

      <LogExpenseDialog
        open={logDrawerOpen}
        // Re-read from the list so an uploaded receipt shows immediately;
        // `editingExpense` is a snapshot taken when the dialog opened.
        expense={
          editingExpense
            ? (expenses.find((e) => e.id === editingExpense.id) ??
              editingExpense)
            : null
        }
        vendors={vendors}
        properties={properties}
        isPending={createExpense.isPending || updateExpense.isPending}
        onOpenChange={setLogDrawerOpen}
        onSave={handleSaveExpense}
        onReceiptsChanged={invalidateExpenses}
      />

      <RecordPaymentDialog
        expense={paymentExpense}
        isPending={recordPayment.isPending}
        onOpenChange={(open) => !open && setPaymentExpense(null)}
        onSave={(expense, payment) => {
          recordPayment.mutate(
            { param: { id: expense.id }, json: payment },
            {
              onSuccess: () => {
                invalidateExpenses();
                setPaymentExpense(null);
                feedback.success(
                  "Payment recorded",
                  `Payment recorded for ${expense.ref}.`,
                );
              },
              onError: (error) => {
                feedback.error(
                  "Couldn't record payment",
                  getApiErrorMessage(error, "Something went wrong. Try again."),
                );
              },
            },
          );
        }}
      />

      <ExpenseHistoryDrawer
        expense={historyExpense}
        onOpenChange={(open) => !open && setHistoryExpense(null)}
      />

      <DeleteExpenseDialog
        expense={expenseToDelete}
        isPending={deleteExpense.isPending}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        onConfirm={(expense) => {
          deleteExpense.mutate(
            { param: { id: expense.id } },
            {
              onSuccess: () => {
                invalidateExpenses();
                setExpenseToDelete(null);
                feedback.success(
                  "Expense deleted",
                  `${expense.ref} has been removed.`,
                );
              },
              onError: (error) => {
                feedback.error(
                  "Couldn't delete expense",
                  getApiErrorMessage(error, "Something went wrong. Try again."),
                );
              },
            },
          );
        }}
      />

      <AddVendorDialog
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        activeOrganizationId={activeScopeId}
      />
    </motion.div>
  );
}
