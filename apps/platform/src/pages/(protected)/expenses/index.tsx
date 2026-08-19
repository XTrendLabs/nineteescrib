import { Button } from "@propertyos/ui/components/button";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TablePagination } from "@/features/bookings/components/table-pagination";
import { AddVendorDialog } from "@/features/expenses/components/add-vendor-dialog";
import { DeleteExpenseDialog } from "@/features/expenses/components/delete-expense-dialog";
import { ExpenseHistoryDrawer } from "@/features/expenses/components/expense-history-drawer";
import { ExpensesTable } from "@/features/expenses/components/expenses-table";
import {
  DEFAULT_EXPENSE_FILTERS,
  FilterToolbar,
} from "@/features/expenses/components/filter-toolbar";
import { LogExpenseDialog } from "@/features/expenses/components/log-expense-dialog";
import { RecordPaymentDialog } from "@/features/expenses/components/record-payment-dialog";
import { SummaryBand } from "@/features/expenses/components/summary-band";
import { VendorDirectory } from "@/features/expenses/components/vendor-directory";
import {
  buildExpenses,
  type Expense,
  HQ_SHARED_ID,
  MOCK_PROPERTIES,
  MOCK_VENDORS,
  type Vendor,
} from "@/features/expenses/lib/mock-data";

export const Route = createFileRoute("/(protected)/expenses/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [expenses, setExpenses] = useState<Expense[]>(() => buildExpenses());
  const [vendors, setVendors] = useState<Vendor[]>(() => MOCK_VENDORS);
  const [filters, setFilters] = useState(DEFAULT_EXPENSE_FILTERS);
  const [tab, setTab] = useState("expenses");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [historyExpense, setHistoryExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [addVendorOpen, setAddVendorOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (
        filters.propertyId !== "all" &&
        expense.propertyId !== filters.propertyId
      ) {
        return false;
      }
      if (filters.category !== "all" && expense.category !== filters.category) {
        return false;
      }
      if (filters.status !== "all" && expense.status !== filters.status) {
        return false;
      }
      if (
        search &&
        !expense.title.toLowerCase().includes(search) &&
        !expense.vendorName.toLowerCase().includes(search) &&
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
          ) : (
            <Button onClick={() => setAddVendorOpen(true)}>
              <PlusIcon />
              Add Vendor
            </Button>
          )}
        </div>

        <TabsPanel value="expenses">
          <div className="flex flex-col gap-4">
            <FilterToolbar
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
            <ExpensesTable
              expenses={paginated}
              onRecordPayment={setPaymentExpense}
              onViewHistory={setHistoryExpense}
              onEdit={openLogDrawer}
              onDelete={setDeleteExpense}
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
          <VendorDirectory vendors={vendors} expenses={expenses} />
        </TabsPanel>
      </Tabs>

      <LogExpenseDialog
        open={logDrawerOpen}
        expense={editingExpense}
        onOpenChange={setLogDrawerOpen}
        onSave={(form, editing) => {
          const totalAmountPaise = Math.round(Number(form.totalAmount) * 100);
          const amountPaidPaise =
            form.initialStatus === "paid"
              ? totalAmountPaise
              : form.initialStatus === "partial"
                ? Math.round(Number(form.initialAmountPaid) * 100)
                : 0;
          const vendor = MOCK_VENDORS.find((v) => v.id === form.vendorId);
          const propertyName =
            form.propertyId === HQ_SHARED_ID
              ? "HQ / Shared"
              : (MOCK_PROPERTIES.find((p) => p.id === form.propertyId)?.name ??
                "Property");

          if (editing) {
            setExpenses((prev) =>
              prev.map((expense) =>
                expense.id === editing.id
                  ? {
                      ...expense,
                      title: form.title,
                      category: form.category,
                      propertyId: form.propertyId,
                      propertyName,
                      vendorId: form.vendorId || undefined,
                      vendorName: vendor?.name ?? "—",
                      totalAmountPaise,
                      amountPaidPaise,
                      status:
                        amountPaidPaise <= 0
                          ? "unpaid"
                          : amountPaidPaise >= totalAmountPaise
                            ? "paid"
                            : "partial",
                      dueDate: form.dueDate
                        ? new Date(form.dueDate)
                        : undefined,
                      isOwnerDeductible: form.isOwnerDeductible,
                      taxAmountPaise: Math.round(
                        (Number(form.taxAmount) || 0) * 100,
                      ),
                      vendorGstin: form.vendorGstin || undefined,
                      itcClaimable: form.itcClaimable,
                      notes: form.notes || undefined,
                    }
                  : expense,
              ),
            );
            return;
          }

          const id = `expense-${Date.now()}`;
          const newExpense: Expense = {
            id,
            ref: `EXP-${100 + expenses.length + 1}`,
            title: form.title,
            category: form.category,
            propertyId: form.propertyId,
            propertyName,
            vendorId: form.vendorId || undefined,
            vendorName: vendor?.name ?? "—",
            totalAmountPaise,
            amountPaidPaise,
            status:
              amountPaidPaise <= 0
                ? "unpaid"
                : amountPaidPaise >= totalAmountPaise
                  ? "paid"
                  : "partial",
            dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
            isOwnerDeductible: form.isOwnerDeductible,
            taxAmountPaise: Math.round((Number(form.taxAmount) || 0) * 100),
            vendorGstin: form.vendorGstin || undefined,
            itcClaimable: form.itcClaimable,
            hasReceipt: false,
            notes: form.notes || undefined,
            createdAt: new Date(),
            createdBy: "You",
            payments:
              amountPaidPaise > 0
                ? [
                    {
                      id: `${id}-pay-1`,
                      amountPaise: amountPaidPaise,
                      method: form.paymentMethod,
                      date: new Date(form.paymentDate),
                      referenceId: form.referenceId || undefined,
                      recordedBy: "You",
                    },
                  ]
                : [],
            ownerPayoutStatus: "not_compiled",
          };
          setExpenses((prev) => [newExpense, ...prev]);
        }}
      />

      <RecordPaymentDialog
        expense={paymentExpense}
        onOpenChange={(open) => !open && setPaymentExpense(null)}
        onSave={(expense, payment) => {
          setExpenses((prev) =>
            prev.map((e) => {
              if (e.id !== expense.id) {
                return e;
              }
              const amountPaidPaise = e.amountPaidPaise + payment.amountPaise;
              return {
                ...e,
                amountPaidPaise,
                status:
                  amountPaidPaise >= e.totalAmountPaise ? "paid" : "partial",
                payments: [
                  ...e.payments,
                  {
                    id: `${e.id}-pay-${e.payments.length + 1}`,
                    amountPaise: payment.amountPaise,
                    method: payment.method,
                    date: payment.date,
                    referenceId: payment.referenceId,
                    notes: payment.notes,
                    recordedBy: "You",
                  },
                ],
              };
            }),
          );
        }}
      />

      <ExpenseHistoryDrawer
        expense={historyExpense}
        onOpenChange={(open) => !open && setHistoryExpense(null)}
      />

      <DeleteExpenseDialog
        expense={deleteExpense}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        onConfirm={(expense) =>
          setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
        }
      />

      <AddVendorDialog
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        onSave={(vendor) => setVendors((prev) => [vendor, ...prev])}
      />
    </motion.div>
  );
}
