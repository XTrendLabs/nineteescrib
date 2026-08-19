/**
 * Structured mock data for the Expenses Management feature.
 *
 * No expenses/expense_payments/vendors tables exist in the schema yet (per
 * docs/expenses_design.md — this page is a pure UI shell), so expenses,
 * vendors, and payment ledgers are all generated here. Determinism follows
 * staff/calendar's seeded-hash approach — no Math.random anywhere, so
 * re-renders never cause data to jump around.
 */

import { addDays } from "date-fns";

/** Deterministic pseudo-random in [0, 1) seeded by a string. */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  let state = h || 1;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export type MockProperty = {
  id: string;
  name: string;
};

/** HQ / Shared expenses use this sentinel instead of a real property id. */
export const HQ_SHARED_ID = "hq-shared";

export const MOCK_PROPERTIES: MockProperty[] = [
  { id: "prop-1", name: "Sunrise Villa - Goa" },
  { id: "prop-2", name: "Hillside Retreat - Coorg" },
  { id: "prop-3", name: "Seaside Cottage - Kerala" },
  { id: "prop-4", name: "Mountain View Homestay - Manali" },
];

export type ExpenseCategory =
  | "maintenance"
  | "utilities"
  | "supplies"
  | "salaries"
  | "admin"
  | "marketing"
  | "capex"
  | "other";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  maintenance: "Maintenance",
  utilities: "Utilities",
  supplies: "Supplies",
  salaries: "Salaries",
  admin: "Administrative",
  marketing: "Marketing",
  capex: "CapEx",
  other: "Other",
};

export const CATEGORY_OPTIONS = Object.keys(
  CATEGORY_LABELS,
) as ExpenseCategory[];

export type PaymentMethod =
  | "cash"
  | "upi"
  | "bank_transfer"
  | "card"
  | "online";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  card: "Credit/Debit Card",
  online: "Online",
};

export const PAYMENT_METHOD_OPTIONS = Object.keys(
  PAYMENT_METHOD_LABELS,
) as PaymentMethod[];

export type ExpenseStatus = "paid" | "partial" | "unpaid";

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  category: ExpenseCategory;
  gstin?: string;
  address?: string;
  notes?: string;
};

export const MOCK_VENDORS: Vendor[] = [
  {
    id: "vendor-1",
    name: "Sagar Plumbing & Repairs",
    contactPerson: "Sagar Naik",
    phone: "9876543210",
    email: "sagar.plumbing@example.com",
    category: "maintenance",
    gstin: "27AAAPL1234C1ZQ",
    address: "Anjuna, Goa",
  },
  {
    id: "vendor-2",
    name: "MESCOM",
    contactPerson: "Billing Desk",
    phone: "1800123456",
    category: "utilities",
    address: "Mangalore Electricity Supply Company",
  },
  {
    id: "vendor-3",
    name: "CleanPro Supplies",
    contactPerson: "Divya Shetty",
    phone: "9123456780",
    email: "orders@cleanprosupplies.in",
    category: "supplies",
    gstin: "29AACCP5678D1ZM",
  },
  {
    id: "vendor-4",
    name: "Coorg Facility Staffing Co.",
    contactPerson: "Manoj Gowda",
    phone: "9812345670",
    category: "salaries",
  },
  {
    id: "vendor-5",
    name: "Meta Ads (Marketing)",
    category: "marketing",
    email: "billing@meta-ads-partner.com",
  },
  {
    id: "vendor-6",
    name: "TallyPrime Software",
    contactPerson: "Account Manager",
    email: "renewals@tallysolutions.com",
    category: "admin",
    gstin: "33AABCT4567E1ZP",
  },
  {
    id: "vendor-7",
    name: "Kerala CapEx Contractors",
    contactPerson: "Thomas Varghese",
    phone: "9445123456",
    category: "capex",
    gstin: "32AAECK8901F1ZR",
    address: "Alleppey, Kerala",
  },
  {
    id: "vendor-8",
    name: "Manali Pest Control",
    contactPerson: "Rakesh Thakur",
    phone: "9418765432",
    category: "maintenance",
  },
];

export type PaymentEntry = {
  id: string;
  amountPaise: number;
  method: PaymentMethod;
  date: Date;
  referenceId?: string;
  notes?: string;
  recordedBy: string;
};

export type Expense = {
  id: string;
  ref: string;
  title: string;
  category: ExpenseCategory;
  propertyId: string | typeof HQ_SHARED_ID;
  propertyName: string;
  vendorId?: string;
  vendorName: string;
  totalAmountPaise: number;
  amountPaidPaise: number;
  status: ExpenseStatus;
  dueDate?: Date;
  isOwnerDeductible: boolean;
  taxAmountPaise: number;
  vendorGstin?: string;
  itcClaimable: boolean;
  hasReceipt: boolean;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  payments: PaymentEntry[];
  ownerPayoutStatus: "not_compiled" | "compiled";
  ownerPayoutStatementLabel?: string;
};

function propertyName(id: string): string {
  if (id === HQ_SHARED_ID) {
    return "HQ / Shared";
  }
  return MOCK_PROPERTIES.find((p) => p.id === id)?.name ?? "Unknown Property";
}

function deriveStatus(totalPaise: number, paidPaise: number): ExpenseStatus {
  if (paidPaise <= 0) {
    return "unpaid";
  }
  if (paidPaise >= totalPaise) {
    return "paid";
  }
  return "partial";
}

const RECORDERS = ["Manager Meera", "Caretaker Sagar", "Admin Arjun"];

type ExpenseSeed = {
  title: string;
  category: ExpenseCategory;
  propertyId: string | typeof HQ_SHARED_ID;
  vendorId?: string;
  totalRupees: number;
  paidRupees: number;
  daysAgo: number; // date logged, relative to "today" (2026-08-19)
  dueInDays?: number;
  isOwnerDeductible: boolean;
  taxRupees?: number;
  itcClaimable?: boolean;
  hasReceipt?: boolean;
  notes?: string;
  installments?: Array<{
    rupees: number;
    method: PaymentMethod;
    daysAgo: number;
    ref?: string;
    recordedBy: string;
  }>;
  ownerPayoutStatus?: "not_compiled" | "compiled";
  ownerPayoutStatementLabel?: string;
};

const EXPENSE_SEED: ExpenseSeed[] = [
  {
    title: "AC Repair & Service",
    category: "maintenance",
    propertyId: "prop-1",
    vendorId: "vendor-1",
    totalRupees: 10_000,
    paidRupees: 5_000,
    daysAgo: 5,
    dueInDays: 5,
    isOwnerDeductible: true,
    taxRupees: 450,
    itcClaimable: false,
    hasReceipt: true,
    notes: "Split AC unit servicing before peak season.",
    installments: [
      {
        rupees: 5_000,
        method: "upi",
        daysAgo: 5,
        ref: "UPI/109283",
        recordedBy: "Manager Meera",
      },
    ],
  },
  {
    title: "Electricity Bill — August",
    category: "utilities",
    propertyId: "prop-2",
    vendorId: "vendor-2",
    totalRupees: 4_200,
    paidRupees: 4_200,
    daysAgo: 7,
    isOwnerDeductible: true,
    hasReceipt: true,
    ownerPayoutStatus: "compiled",
    ownerPayoutStatementLabel: "Included in July 2026 Owner Statement",
    installments: [
      {
        rupees: 4_200,
        method: "bank_transfer",
        daysAgo: 7,
        ref: "NEFT/88213",
        recordedBy: "Manager Meera",
      },
    ],
  },
  {
    title: "Pool Cleaning Services",
    category: "maintenance",
    propertyId: "prop-1",
    totalRupees: 3_500,
    paidRupees: 0,
    daysAgo: 2,
    dueInDays: 3,
    isOwnerDeductible: true,
    hasReceipt: false,
    notes: "Monthly pool maintenance contract.",
  },
  {
    title: "Housekeeping Supplies Restock",
    category: "supplies",
    propertyId: "prop-3",
    vendorId: "vendor-3",
    totalRupees: 6_800,
    paidRupees: 6_800,
    daysAgo: 12,
    isOwnerDeductible: false,
    hasReceipt: true,
    installments: [
      {
        rupees: 6_800,
        method: "card",
        daysAgo: 12,
        ref: "CARD/4521",
        recordedBy: "Caretaker Sagar",
      },
    ],
  },
  {
    title: "Caretaker Salary — August",
    category: "salaries",
    propertyId: "prop-2",
    vendorId: "vendor-4",
    totalRupees: 18_000,
    paidRupees: 9_000,
    daysAgo: 4,
    dueInDays: 10,
    isOwnerDeductible: false,
    hasReceipt: false,
    installments: [
      {
        rupees: 9_000,
        method: "bank_transfer",
        daysAgo: 4,
        ref: "NEFT/91021",
        recordedBy: "Admin Arjun",
      },
    ],
  },
  {
    title: "Central Office Internet",
    category: "admin",
    propertyId: HQ_SHARED_ID,
    vendorId: "vendor-6",
    totalRupees: 2_499,
    paidRupees: 2_499,
    daysAgo: 20,
    isOwnerDeductible: false,
    taxRupees: 450,
    itcClaimable: true,
    hasReceipt: true,
    installments: [
      {
        rupees: 2_499,
        method: "card",
        daysAgo: 20,
        ref: "CARD/7788",
        recordedBy: "Admin Arjun",
      },
    ],
  },
  {
    title: "Meta Ads — August Campaign",
    category: "marketing",
    propertyId: HQ_SHARED_ID,
    vendorId: "vendor-5",
    totalRupees: 15_000,
    paidRupees: 0,
    daysAgo: 1,
    dueInDays: 15,
    isOwnerDeductible: false,
    hasReceipt: false,
    notes: "Boosted posts for Goa & Coorg listings.",
  },
  {
    title: "New Water Heater Installation",
    category: "capex",
    propertyId: "prop-3",
    vendorId: "vendor-7",
    totalRupees: 22_000,
    paidRupees: 12_000,
    daysAgo: 9,
    dueInDays: 20,
    isOwnerDeductible: true,
    taxRupees: 1980,
    itcClaimable: true,
    hasReceipt: true,
    installments: [
      {
        rupees: 12_000,
        method: "bank_transfer",
        daysAgo: 9,
        ref: "NEFT/33210",
        recordedBy: "Manager Meera",
      },
    ],
  },
  {
    title: "Pest Control Treatment",
    category: "maintenance",
    propertyId: "prop-4",
    vendorId: "vendor-8",
    totalRupees: 2_800,
    paidRupees: 2_800,
    daysAgo: 15,
    isOwnerDeductible: true,
    hasReceipt: true,
    ownerPayoutStatus: "compiled",
    ownerPayoutStatementLabel: "Included in July 2026 Owner Statement",
    installments: [
      {
        rupees: 2_800,
        method: "cash",
        daysAgo: 15,
        ref: "Cash Receipt #42",
        recordedBy: "Caretaker Sagar",
      },
    ],
  },
  {
    title: "Company Insurance Premium",
    category: "admin",
    propertyId: HQ_SHARED_ID,
    totalRupees: 45_000,
    paidRupees: 0,
    daysAgo: 3,
    dueInDays: 12,
    isOwnerDeductible: false,
    hasReceipt: false,
    notes: "Annual general liability insurance renewal.",
  },
  {
    title: "Garden & Landscaping",
    category: "maintenance",
    propertyId: "prop-4",
    totalRupees: 5_200,
    paidRupees: 2_000,
    daysAgo: 6,
    dueInDays: 8,
    isOwnerDeductible: true,
    hasReceipt: false,
    installments: [
      {
        rupees: 2_000,
        method: "upi",
        daysAgo: 6,
        ref: "UPI/665521",
        recordedBy: "Caretaker Sagar",
      },
    ],
  },
  {
    title: "Office Stationery & Printing",
    category: "other",
    propertyId: HQ_SHARED_ID,
    totalRupees: 1_250,
    paidRupees: 1_250,
    daysAgo: 18,
    isOwnerDeductible: false,
    hasReceipt: true,
    installments: [
      {
        rupees: 1_250,
        method: "cash",
        daysAgo: 18,
        recordedBy: "Admin Arjun",
      },
    ],
  },
];

export function buildExpenses(): Expense[] {
  const today = new Date("2026-08-19T00:00:00");

  return EXPENSE_SEED.map((seed, idx) => {
    const id = `expense-${idx + 1}`;
    const rand = seededRandom(`expense-${id}`);
    const ref = `EXP-${100 + idx + 1}`;
    const createdAt = addDays(today, -seed.daysAgo);
    const vendor = seed.vendorId
      ? MOCK_VENDORS.find((v) => v.id === seed.vendorId)
      : undefined;
    const totalAmountPaise = seed.totalRupees * 100;
    const amountPaidPaise = seed.paidRupees * 100;
    const status = deriveStatus(totalAmountPaise, amountPaidPaise);

    const payments: PaymentEntry[] = (seed.installments ?? []).map(
      (inst, pIdx) => ({
        id: `${id}-pay-${pIdx}`,
        amountPaise: inst.rupees * 100,
        method: inst.method,
        date: addDays(today, -inst.daysAgo),
        referenceId: inst.ref,
        recordedBy: inst.recordedBy,
      }),
    );

    return {
      id,
      ref,
      title: seed.title,
      category: seed.category,
      propertyId: seed.propertyId,
      propertyName: propertyName(seed.propertyId),
      vendorId: seed.vendorId,
      vendorName: vendor?.name ?? "—",
      totalAmountPaise,
      amountPaidPaise,
      status,
      dueDate:
        status !== "paid" && seed.dueInDays !== undefined
          ? addDays(today, seed.dueInDays)
          : undefined,
      isOwnerDeductible: seed.isOwnerDeductible,
      taxAmountPaise: (seed.taxRupees ?? 0) * 100,
      vendorGstin: vendor?.gstin,
      itcClaimable: seed.itcClaimable ?? false,
      hasReceipt: seed.hasReceipt ?? rand() > 0.5,
      notes: seed.notes,
      createdAt,
      createdBy: RECORDERS[idx % RECORDERS.length],
      payments,
      ownerPayoutStatus: seed.ownerPayoutStatus ?? "not_compiled",
      ownerPayoutStatementLabel: seed.ownerPayoutStatementLabel,
    };
  });
}

export function vendorActiveExpenseCount(
  vendorId: string,
  expenses: Expense[],
): number {
  return expenses.filter((e) => e.vendorId === vendorId && e.status !== "paid")
    .length;
}

export function vendorTotalPaid(vendorId: string, expenses: Expense[]): number {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .reduce((sum, e) => sum + e.amountPaidPaise, 0);
}

export function vendorTotalPending(
  vendorId: string,
  expenses: Expense[],
): number {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .reduce((sum, e) => sum + (e.totalAmountPaise - e.amountPaidPaise), 0);
}

export function vendorExpenses(
  vendorId: string,
  expenses: Expense[],
): Expense[] {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
