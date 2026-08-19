/**
 * Structured mock data for the Guest Invoices feature.
 *
 * No invoices/invoice_items/invoice_reminders tables exist in the schema yet
 * (per docs/invoices_design.md — this page is a pure UI shell), so invoices,
 * line items, payments, and reminders are all generated here. Determinism
 * follows the staff/calendar/expenses seeded-hash approach — no Math.random
 * anywhere, so re-renders never cause data to jump around.
 */

import { addDays } from "date-fns";

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

export const MOCK_PROPERTIES: MockProperty[] = [
  { id: "prop-1", name: "Sunrise Villa - Goa" },
  { id: "prop-2", name: "Hillside Retreat - Coorg" },
  { id: "prop-3", name: "Seaside Cottage - Kerala" },
  { id: "prop-4", name: "Mountain View Homestay - Manali" },
];

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export type LineItemType =
  | "room"
  | "addon"
  | "fnb"
  | "service"
  | "fee"
  | "discount";

export const ITEM_TYPE_LABELS: Record<LineItemType, string> = {
  room: "Room Stay",
  addon: "Add-on",
  fnb: "F&B",
  service: "Service",
  fee: "Fee",
  discount: "Discount",
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  taxRateBps: number; // basis points, 1800 = 18%
  itemType: LineItemType;
};

export type PaymentMethod = "razorpay_upi" | "cash" | "bank_transfer" | "card";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  razorpay_upi: "Razorpay (UPI)",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  card: "Card",
};

export type InvoicePayment = {
  id: string;
  amountPaise: number;
  method: PaymentMethod;
  date: Date;
  transactionId?: string;
  recordedBy: string;
};

export type ReminderChannel = "whatsapp" | "email" | "sms";

export const REMINDER_CHANNEL_LABELS: Record<ReminderChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
};

export type ReminderStatus = "sent" | "failed" | "delivered";

export type InvoiceReminder = {
  id: string;
  channel: ReminderChannel;
  recipient: string;
  status: ReminderStatus;
  sentAt: Date;
  sentBy?: string; // undefined = automated
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  propertyId: string;
  propertyName: string;
  bookingRef?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestGstin?: string;
  companyName?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date;
  checkIn?: Date;
  checkOut?: Date;
  items: InvoiceItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  amountPaidPaise: number;
  payments: InvoicePayment[];
  reminders: InvoiceReminder[];
  publicToken: string;
  notes?: string;
};

function deriveStatus(
  totalPaise: number,
  paidPaise: number,
  dueDate: Date | undefined,
  today: Date,
  fallback: InvoiceStatus,
): InvoiceStatus {
  if (fallback === "draft" || fallback === "cancelled") {
    return fallback;
  }
  if (paidPaise >= totalPaise) {
    return "paid";
  }
  if (
    dueDate &&
    dueDate.getTime() < today.getTime() &&
    paidPaise < totalPaise
  ) {
    return "overdue";
  }
  if (paidPaise > 0) {
    return "partial";
  }
  return "sent";
}

const RECORDERS = ["Manager Meera", "Caretaker Sagar", "Admin Arjun"];

type InvoiceSeed = {
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestGstin?: string;
  companyName?: string;
  propertyId: string;
  bookingRef?: string;
  issuedDaysAgo: number;
  dueInDays?: number;
  checkInDaysAgo?: number;
  nights?: number;
  roomRateRupees: number;
  addons?: Array<{
    description: string;
    quantity: number;
    unitPriceRupees: number;
    itemType: LineItemType;
  }>;
  discountRupees?: number;
  taxRateBps: number;
  paidRupees: number;
  fallbackStatus: InvoiceStatus;
  payments?: Array<{
    rupees: number;
    method: PaymentMethod;
    daysAgo: number;
    txnId?: string;
    recordedBy: string;
  }>;
  reminders?: Array<{
    channel: ReminderChannel;
    daysAgo: number;
    status: ReminderStatus;
    sentBy?: string;
  }>;
  notes?: string;
};

const INVOICE_SEED: InvoiceSeed[] = [
  {
    guestName: "Arjun Sen",
    guestPhone: "9876543210",
    propertyId: "prop-1",
    bookingRef: "POS-104",
    issuedDaysAgo: 11,
    dueInDays: -3,
    checkInDaysAgo: 9,
    nights: 3,
    roomRateRupees: 4500,
    addons: [
      {
        description: "Extra Bed",
        quantity: 3,
        unitPriceRupees: 800,
        itemType: "addon",
      },
      {
        description: "Airport Transfer",
        quantity: 1,
        unitPriceRupees: 1500,
        itemType: "addon",
      },
    ],
    taxRateBps: 1800,
    paidRupees: 10000,
    fallbackStatus: "sent",
    payments: [
      {
        rupees: 10000,
        method: "razorpay_upi",
        daysAgo: 9,
        txnId: "pay_MZk9xJ3lQ2ab",
        recordedBy: "System",
      },
    ],
    reminders: [
      { channel: "whatsapp", daysAgo: 10, status: "delivered" },
      { channel: "whatsapp", daysAgo: 2, status: "sent" },
    ],
    notes: "Guest requested late checkout, fee waived.",
  },
  {
    guestName: "Sarah Kumar",
    guestEmail: "sarah@example.com",
    guestPhone: "9123456789",
    propertyId: "prop-2",
    bookingRef: "POS-103",
    issuedDaysAgo: 12,
    checkInDaysAgo: 10,
    nights: 2,
    roomRateRupees: 6100,
    taxRateBps: 1200,
    paidRupees: 14200,
    fallbackStatus: "paid",
    payments: [
      {
        rupees: 14200,
        method: "razorpay_upi",
        daysAgo: 10,
        txnId: "pay_NAj2pQ9wR1cd",
        recordedBy: "System",
      },
    ],
  },
  {
    guestName: "Rohan Kapoor",
    guestPhone: "9988776655",
    propertyId: "prop-1",
    bookingRef: "POS-108",
    issuedDaysAgo: 2,
    dueInDays: 1,
    checkInDaysAgo: -1,
    nights: 4,
    roomRateRupees: 5200,
    addons: [
      {
        description: "Laundry Service",
        quantity: 1,
        unitPriceRupees: 600,
        itemType: "service",
      },
    ],
    taxRateBps: 1800,
    paidRupees: 0,
    fallbackStatus: "sent",
    reminders: [{ channel: "whatsapp", daysAgo: 1, status: "delivered" }],
  },
  {
    guestName: "Priya Nair",
    guestEmail: "priya.nair@example.com",
    guestPhone: "9090909090",
    guestGstin: "32AABCU9603R1ZM",
    companyName: "Nair Consulting LLP",
    propertyId: "prop-3",
    bookingRef: "POS-101",
    issuedDaysAgo: 20,
    dueInDays: -8,
    checkInDaysAgo: 18,
    nights: 5,
    roomRateRupees: 7800,
    addons: [
      {
        description: "Airport Transfer",
        quantity: 2,
        unitPriceRupees: 1500,
        itemType: "addon",
      },
      {
        description: "Room Service — Dinner",
        quantity: 3,
        unitPriceRupees: 950,
        itemType: "fnb",
      },
    ],
    discountRupees: 2000,
    taxRateBps: 1800,
    paidRupees: 25000,
    fallbackStatus: "sent",
    payments: [
      {
        rupees: 25000,
        method: "bank_transfer",
        daysAgo: 18,
        txnId: "NEFT/77213",
        recordedBy: "Admin Arjun",
      },
    ],
    reminders: [
      { channel: "email", daysAgo: 9, status: "delivered" },
      { channel: "whatsapp", daysAgo: 5, status: "failed" },
      { channel: "email", daysAgo: 1, status: "sent" },
    ],
    notes: "Corporate booking — ITC claimable invoice required.",
  },
  {
    guestName: "Vikram Desai",
    guestPhone: "9345678901",
    propertyId: "prop-2",
    bookingRef: "POS-106",
    issuedDaysAgo: 6,
    dueInDays: 4,
    checkInDaysAgo: 4,
    nights: 2,
    roomRateRupees: 4200,
    taxRateBps: 1200,
    paidRupees: 4200,
    fallbackStatus: "sent",
    payments: [
      {
        rupees: 4200,
        method: "cash",
        daysAgo: 4,
        recordedBy: "Caretaker Sagar",
      },
    ],
  },
  {
    guestName: "Meera Iyer",
    guestEmail: "meera.iyer@example.com",
    guestPhone: "9765432109",
    propertyId: "prop-4",
    bookingRef: "POS-99",
    issuedDaysAgo: 30,
    dueInDays: -20,
    checkInDaysAgo: 28,
    nights: 3,
    roomRateRupees: 3600,
    addons: [
      {
        description: "Minibar",
        quantity: 1,
        unitPriceRupees: 500,
        itemType: "fnb",
      },
    ],
    taxRateBps: 0,
    paidRupees: 5000,
    fallbackStatus: "sent",
    payments: [
      {
        rupees: 5000,
        method: "card",
        daysAgo: 27,
        txnId: "CARD/9182",
        recordedBy: "Manager Meera",
      },
    ],
    reminders: [
      { channel: "whatsapp", daysAgo: 20, status: "delivered" },
      { channel: "whatsapp", daysAgo: 12, status: "delivered" },
      { channel: "email", daysAgo: 4, status: "sent" },
    ],
    notes: "Guest disputes late-checkout fee — pending resolution.",
  },
  {
    guestName: "Farhan Ali",
    guestPhone: "9812309876",
    propertyId: "prop-1",
    bookingRef: "POS-110",
    issuedDaysAgo: 0,
    checkInDaysAgo: -2,
    nights: 2,
    roomRateRupees: 4500,
    taxRateBps: 1800,
    paidRupees: 0,
    fallbackStatus: "draft",
    notes: "Awaiting guest confirmation before sending.",
  },
  {
    guestName: "Ananya Rao",
    guestEmail: "ananya.rao@example.com",
    guestPhone: "9234567810",
    propertyId: "prop-3",
    bookingRef: "POS-97",
    issuedDaysAgo: 40,
    checkInDaysAgo: 38,
    nights: 6,
    roomRateRupees: 5800,
    addons: [
      {
        description: "Activity Booking — Backwater Cruise",
        quantity: 2,
        unitPriceRupees: 2200,
        itemType: "service",
      },
    ],
    taxRateBps: 1800,
    paidRupees: 45000,
    fallbackStatus: "paid",
    payments: [
      {
        rupees: 45000,
        method: "razorpay_upi",
        daysAgo: 37,
        txnId: "pay_QRs8vN2xT4ef",
        recordedBy: "System",
      },
    ],
  },
];

export function buildInvoices(): Invoice[] {
  const today = new Date("2026-08-19T00:00:00");

  return INVOICE_SEED.map((seed, idx) => {
    const id = `invoice-${idx + 1}`;
    const rand = seededRandom(`invoice-${id}`);
    const invoiceNumber = `INV-2026-${String(idx + 1).padStart(4, "0")}`;
    const issueDate = addDays(today, -seed.issuedDaysAgo);
    const dueDate =
      seed.dueInDays !== undefined ? addDays(today, seed.dueInDays) : undefined;
    const checkIn =
      seed.checkInDaysAgo !== undefined
        ? addDays(today, -seed.checkInDaysAgo)
        : undefined;
    const checkOut =
      checkIn && seed.nights ? addDays(checkIn, seed.nights) : undefined;
    const property = MOCK_PROPERTIES.find((p) => p.id === seed.propertyId);

    const items: InvoiceItem[] = [];
    if (seed.nights) {
      const unitPricePaise = seed.roomRateRupees * 100;
      items.push({
        id: `${id}-item-room`,
        description: `Room Stay (${seed.nights} night${seed.nights === 1 ? "" : "s"} @ ₹${seed.roomRateRupees.toLocaleString("en-IN")})`,
        quantity: seed.nights,
        unitPricePaise,
        totalPaise: unitPricePaise * seed.nights,
        taxRateBps: seed.taxRateBps,
        itemType: "room",
      });
    }
    for (const [i, addon] of (seed.addons ?? []).entries()) {
      const unitPricePaise = addon.unitPriceRupees * 100;
      items.push({
        id: `${id}-item-addon-${i}`,
        description: addon.description,
        quantity: addon.quantity,
        unitPricePaise,
        totalPaise: unitPricePaise * addon.quantity,
        taxRateBps: seed.taxRateBps,
        itemType: addon.itemType,
      });
    }

    const subtotalPaise = items.reduce((sum, item) => sum + item.totalPaise, 0);
    const discountPaise = (seed.discountRupees ?? 0) * 100;
    const taxableBase = subtotalPaise - discountPaise;
    const taxPaise = Math.round((taxableBase * seed.taxRateBps) / 10000);
    const totalPaise = taxableBase + taxPaise;
    const amountPaidPaise = seed.paidRupees * 100;

    const payments: InvoicePayment[] = (seed.payments ?? []).map((p, pIdx) => ({
      id: `${id}-pay-${pIdx}`,
      amountPaise: p.rupees * 100,
      method: p.method,
      date: addDays(today, -p.daysAgo),
      transactionId: p.txnId,
      recordedBy: p.recordedBy,
    }));

    const reminders: InvoiceReminder[] = (seed.reminders ?? []).map(
      (r, rIdx) => ({
        id: `${id}-reminder-${rIdx}`,
        channel: r.channel,
        recipient:
          r.channel === "email" ? (seed.guestEmail ?? "") : seed.guestPhone,
        status: r.status,
        sentAt: addDays(today, -r.daysAgo),
        sentBy: r.sentBy,
      }),
    );

    const status = deriveStatus(
      totalPaise,
      amountPaidPaise,
      dueDate,
      today,
      seed.fallbackStatus,
    );

    return {
      id,
      invoiceNumber,
      propertyId: seed.propertyId,
      propertyName: property?.name ?? "Unknown Property",
      bookingRef: seed.bookingRef,
      guestName: seed.guestName,
      guestEmail: seed.guestEmail,
      guestPhone: seed.guestPhone,
      guestGstin: seed.guestGstin,
      companyName: seed.companyName,
      status,
      issueDate,
      dueDate,
      checkIn,
      checkOut,
      items,
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      amountPaidPaise,
      payments,
      reminders,
      publicToken: `sec_${id}${Math.floor(rand() * 1000)}`,
      notes: seed.notes,
    };
  });
}

export function recorderOptions() {
  return RECORDERS;
}
