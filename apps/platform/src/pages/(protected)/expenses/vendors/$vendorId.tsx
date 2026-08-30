import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  DataTable,
  DataTableContainer,
} from "@propertyos/ui/components/data-table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeftIcon, MailIcon, PhoneIcon } from "lucide-react";
import { motion } from "motion/react";
import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useExpenses } from "@/features/expenses/api/use-expenses";
import { useVendor } from "@/features/expenses/api/use-vendor";
import { CategoryBadge } from "@/features/expenses/components/category-badge";
import { StatusPill } from "@/features/expenses/components/status-pill";
import {
  type Expense,
  vendorActiveExpenseCount,
  vendorExpenses,
  vendorTotalPaid,
  vendorTotalPending,
} from "@/features/expenses/lib/expense";
import { formatDate, formatInrFromPaise } from "@/features/expenses/lib/format";
import { normalizeVendorCategory } from "@/features/expenses/lib/vendor";
import { useBreadcrumbLabel } from "@/shared/lib/breadcrumb-label";

export const Route = createFileRoute("/(protected)/expenses/vendors/$vendorId")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { vendorId } = Route.useParams();
  const { activeScopeId } = useActiveHq();
  const { data: expenseResponse } = useExpenses(activeScopeId);
  const expenses = (expenseResponse?.data ?? []) as unknown as Expense[];
  const { data: response, isLoading, isError } = useVendor(vendorId);
  const vendor = response?.data;

  // The URL carries an id, so the breadcrumb needs the name from here. This
  // sits above the early returns: hooks cannot run conditionally.
  useBreadcrumbLabel(vendorId, vendor?.name);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-muted-foreground text-sm">Loading vendor...</p>
      </div>
    );
  }

  // A vendor outside the caller's HQ is refused rather than returned, so a
  // failed request and a missing record land in the same place -- from here
  // they are the same thing: nothing to show.
  if (isError || !vendor) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-muted-foreground text-sm">
          This vendor could not be found.
        </p>
        <Link to="/expenses" className="text-foreground text-sm underline">
          Back to Expenses
        </Link>
      </div>
    );
  }

  const paidPaise = vendorTotalPaid(vendor.id, expenses);
  const pendingPaise = vendorTotalPending(vendor.id, expenses);
  const activeCount = vendorActiveExpenseCount(vendor.id, expenses);
  const history = vendorExpenses(vendor.id, expenses);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div>
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground hover:underline"
        >
          <ChevronLeftIcon className="size-3.5" />
          Back to Expenses
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-display-md">{vendor.name}</h1>
          <CategoryBadge category={normalizeVendorCategory(vendor.category)} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
          {vendor.contactPerson && <span>{vendor.contactPerson}</span>}
          {vendor.phone && (
            <span className="flex items-center gap-1">
              <PhoneIcon className="size-3" />
              {vendor.phone}
            </span>
          )}
          {vendor.email && (
            <span className="flex items-center gap-1">
              <MailIcon className="size-3" />
              {vendor.email}
            </span>
          )}
          {vendor.gstin && <span>GSTIN: {vendor.gstin}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <CardContent className="flex flex-col gap-1 px-0">
            <span className="text-muted-foreground text-xs">Total Paid</span>
            <span className="font-semibold text-xl">
              {formatInrFromPaise(paidPaise)}
            </span>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="flex flex-col gap-1 px-0">
            <span className="text-muted-foreground text-xs">
              Pending Balance
            </span>
            <span className="font-semibold text-xl">
              {formatInrFromPaise(pendingPaise)}
            </span>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="flex flex-col gap-1 px-0">
            <span className="text-muted-foreground text-xs">
              Active Expenses
            </span>
            <span className="font-semibold text-xl">{activeCount}</span>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="flex flex-col gap-1 px-0">
            <span className="text-muted-foreground text-xs">
              Total Expenses
            </span>
            <span className="font-semibold text-xl">{history.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-sm">Expense History</p>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
            <p className="text-sm">No expenses logged for this vendor yet</p>
          </div>
        ) : (
          <DataTableContainer>
            <DataTable minWidth={640}>
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    Ref / Date
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    Title
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.ref}</span>
                        <span className="text-muted-foreground">
                          {formatDate(new Date(expense.createdAt))}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      {expense.title}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <StatusPill expense={expense} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle font-medium">
                      {formatInrFromPaise(expense.totalAmountPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </DataTableContainer>
        )}
      </div>
    </motion.div>
  );
}
