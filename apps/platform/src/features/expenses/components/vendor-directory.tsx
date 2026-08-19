import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type Expense,
  type ExpenseCategory,
  type Vendor,
  vendorActiveExpenseCount,
  vendorTotalPaid,
  vendorTotalPending,
} from "../lib/mock-data";
import { VendorCard } from "./vendor-card";

export function VendorDirectory({
  vendors,
  expenses,
}: {
  vendors: Vendor[];
  expenses: Expense[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");

  const categoryLabel =
    category === "all" ? "All Categories" : CATEGORY_LABELS[category];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (category !== "all" && vendor.category !== category) {
        return false;
      }
      if (
        query &&
        !vendor.name.toLowerCase().includes(query) &&
        !(vendor.contactPerson?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });
  }, [vendors, search, category]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor or contact..."
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ExpenseCategory | "all")}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Category">{categoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
          <p className="text-sm">No vendors match your filters</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              totalPaidPaise={vendorTotalPaid(vendor.id, expenses)}
              totalPendingPaise={vendorTotalPending(vendor.id, expenses)}
              activeExpenseCount={vendorActiveExpenseCount(vendor.id, expenses)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
