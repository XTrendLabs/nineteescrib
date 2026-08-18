// Mock data for the Settings feature. UI-shell only — no backend wiring.

export type CompanyProfile = {
  companyName: string;
  displayName: string;
  slug: string;
  logoUrl?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  pan: string;
  gstin: string;
  cin?: string;
  businessEmail: string;
  businessPhone: string;
  supportEmail: string;
  website: string;
};

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  companyName: "Sunrise Hospitality Pvt Ltd",
  displayName: "Sunrise Retreats",
  slug: "sunrise-retreats",
  addressLine1: "42/A Ribandar Industrial Estate",
  addressLine2: "Panaji",
  city: "Panaji",
  state: "Goa",
  country: "India",
  pin: "403001",
  pan: "AABCS1234A",
  gstin: "30AABCS1234A1ZV",
  cin: "U55101GA2020PTC012345",
  businessEmail: "hello@sunriseretreats.in",
  businessPhone: "+91 832 2456789",
  supportEmail: "support@sunriseretreats.in",
  website: "https://sunriseretreats.in",
};

export type MemberRole = "owner" | "admin" | "member";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
  avatarUrl?: string;
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Bikram S.",
    email: "bikram@xtrend.in",
    role: "owner",
    joinedAt: "Mar 24",
  },
  {
    id: "mem-2",
    name: "Meera K.",
    email: "meera@email.com",
    role: "admin",
    joinedAt: "Jul 24",
  },
  {
    id: "mem-3",
    name: "Sagar P.",
    email: "sagar@email.com",
    role: "member",
    joinedAt: "Aug 24",
  },
];

export type PendingInvite = {
  id: string;
  email: string;
  role: MemberRole;
  sentAgo: string;
};

export const MOCK_PENDING_INVITES: PendingInvite[] = [
  { id: "inv-1", email: "ravi@email.com", role: "member", sentAgo: "2d ago" },
];

export type UsageLimit = {
  resource: string;
  used: number;
  limit: number;
};

export type FeatureFlag = {
  label: string;
  enabled: boolean;
  upgradeTier?: string;
};

export const MOCK_PLAN = {
  name: "Growth Plan",
  price: "₹2,499/month",
  billingCycle: "Monthly",
  nextRenewal: "Sep 18, 2025",
  status: "Active" as const,
};

export const MOCK_USAGE_LIMITS: UsageLimit[] = [
  { resource: "Properties", used: 3, limit: 5 },
  { resource: "Room Types", used: 8, limit: 15 },
  { resource: "Staff Members", used: 6, limit: 10 },
  { resource: "Bookings (this mo.)", used: 42, limit: 200 },
  { resource: "Channel Connections", used: 1, limit: 3 },
];

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { label: "WhatsApp Notifications", enabled: true },
  { label: "Owner Payouts & Statements", enabled: true },
  { label: "Custom Domain", enabled: false, upgradeTier: "Pro" },
  {
    label: "White-Label Booking Page",
    enabled: false,
    upgradeTier: "Enterprise",
  },
  { label: "API Access", enabled: false, upgradeTier: "Enterprise" },
];

export const MOCK_AVAILABLE_PLANS = [
  { id: "starter", name: "Starter", price: "₹999/month", properties: 1 },
  { id: "growth", name: "Growth", price: "₹2,499/month", properties: 5 },
  { id: "pro", name: "Pro", price: "₹4,999/month", properties: 15 },
  { id: "enterprise", name: "Enterprise", price: "Custom", properties: 999 },
];

export type PaymentMethod = {
  brand: string;
  last4: string;
  expiry: string;
};

export const MOCK_PAYMENT_METHOD: PaymentMethod = {
  brand: "Visa",
  last4: "4242",
  expiry: "12/26",
};

export type Invoice = {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Failed" | "Pending";
};

export const MOCK_INVOICES: Invoice[] = [
  { id: "INV-0012", date: "Aug 1, 2025", amount: "₹2,499", status: "Paid" },
  { id: "INV-0011", date: "Jul 1, 2025", amount: "₹2,499", status: "Paid" },
  { id: "INV-0010", date: "Jun 1, 2025", amount: "₹1,999", status: "Paid" },
];

export type GatewayStatus = "connected" | "not_connected";

export type PaymentGateway = {
  id: string;
  name: string;
  status: GatewayStatus;
  keyIdPreview?: string;
  usedByProperties: string[];
};

export const MOCK_PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: "razorpay",
    name: "Razorpay",
    status: "connected",
    keyIdPreview: "rzp_live_xxxxxxxxxx",
    usedByProperties: ["Sunrise Villa", "Hilltop Retreat"],
  },
  {
    id: "stripe",
    name: "Stripe",
    status: "not_connected",
    usedByProperties: [],
  },
  {
    id: "payu",
    name: "PayU",
    status: "not_connected",
    usedByProperties: [],
  },
];

export type NotificationChannel = "email" | "whatsapp" | "sms" | "push";

export type NotificationEvent = {
  id: string;
  label: string;
  channels: Record<NotificationChannel, boolean>;
};

export const MOCK_GUEST_NOTIFICATIONS: NotificationEvent[] = [
  {
    id: "booking-confirmation",
    label: "Booking Confirmation",
    channels: { email: true, whatsapp: true, sms: false, push: false },
  },
  {
    id: "payment-receipt",
    label: "Payment Receipt",
    channels: { email: true, whatsapp: false, sms: false, push: false },
  },
  {
    id: "checkin-reminder",
    label: "Check-in Reminder (1 day)",
    channels: { email: true, whatsapp: true, sms: false, push: false },
  },
  {
    id: "checkout-reminder",
    label: "Check-out Reminder",
    channels: { email: true, whatsapp: false, sms: false, push: false },
  },
  {
    id: "review-request",
    label: "Post-Stay Review Request",
    channels: { email: true, whatsapp: true, sms: false, push: false },
  },
  {
    id: "cancellation-confirmation",
    label: "Cancellation Confirmation",
    channels: { email: true, whatsapp: false, sms: false, push: false },
  },
];

export const MOCK_HOST_NOTIFICATIONS: NotificationEvent[] = [
  {
    id: "new-booking",
    label: "New Booking Received",
    channels: { email: true, whatsapp: true, sms: false, push: true },
  },
  {
    id: "payment-captured",
    label: "Payment Captured",
    channels: { email: true, whatsapp: false, sms: false, push: true },
  },
  {
    id: "cancellation-alert",
    label: "Cancellation Alert",
    channels: { email: true, whatsapp: true, sms: false, push: true },
  },
  {
    id: "channel-sync-conflict",
    label: "Channel Sync Conflict",
    channels: { email: true, whatsapp: true, sms: false, push: true },
  },
  {
    id: "checkin-completed",
    label: "Guest Check-in Completed",
    channels: { email: false, whatsapp: true, sms: false, push: false },
  },
  {
    id: "daily-revenue-summary",
    label: "Daily Revenue Summary",
    channels: { email: true, whatsapp: false, sms: false, push: false },
  },
];

export const MOCK_WHATSAPP_CONFIG = {
  provider: "MSG91",
  apiKeyMasked: "••••••••••••",
  senderId: "SUNRSE",
  status: "Active" as const,
  lastSent: "2m ago",
};

export type SecuritySettings = {
  passwordPolicy: string;
  twoFactorEnforcement: "optional" | "required_admin";
  sessionTimeout: string;
  oauthGoogle: boolean;
  oauthMicrosoft: boolean;
};

export const MOCK_SECURITY_SETTINGS: SecuritySettings = {
  passwordPolicy: "Minimum 8 characters",
  twoFactorEnforcement: "required_admin",
  sessionTimeout: "7 days",
  oauthGoogle: true,
  oauthMicrosoft: false,
};

export type ActiveSession = {
  id: string;
  device: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
};

export const MOCK_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "sess-1",
    device: "Chrome / Mac",
    ipAddress: "103.21.xxx.xxx",
    location: "Goa, IN",
    isCurrent: true,
  },
  {
    id: "sess-2",
    device: "Safari / iOS",
    ipAddress: "49.37.xxx.xxx",
    location: "Goa, IN",
    isCurrent: false,
  },
];

export type AuditLogEntry = {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
};

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "log-1",
    time: "10:32 AM",
    actor: "Bikram S.",
    action: "Updated room type price",
    target: "Deluxe",
  },
  {
    id: "log-2",
    time: "09:15 AM",
    actor: "Meera K.",
    action: "Checked in guest",
    target: "POS-102",
  },
  {
    id: "log-3",
    time: "08:47 AM",
    actor: "System",
    action: "Payment captured (RZP)",
    target: "POS-103",
  },
  {
    id: "log-4",
    time: "Yesterday",
    actor: "Sagar P.",
    action: "Marked housekeeping done",
    target: "Room 201",
  },
  {
    id: "log-5",
    time: "Yesterday",
    actor: "Bikram S.",
    action: "Invited new member",
    target: "ravi@email.com",
  },
  {
    id: "log-6",
    time: "2 days ago",
    actor: "Meera K.",
    action: "Updated tax configuration",
    target: "Sunrise Villa",
  },
  {
    id: "log-7",
    time: "3 days ago",
    actor: "System",
    action: "Scheduled report sent",
    target: "Weekly Revenue Summary",
  },
];

export type ScheduledReport = {
  id: string;
  name: string;
  schedule: string;
  recipient: string;
};

export const MOCK_SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: "rep-1",
    name: "Weekly Revenue Summary",
    schedule: "Every Monday 9:00 AM",
    recipient: "bikram@xtrend.in",
  },
  {
    id: "rep-2",
    name: "Monthly Tax Report",
    schedule: "1st of each month",
    recipient: "ca@sunriseretreats.in",
  },
];

export const MOCK_EXPORT_DATA_TYPES = [
  "Bookings Data",
  "Guest CRM Data",
  "Revenue Report",
  "Payment Records",
  "Staff Attendance",
] as const;

// ---------------------------------------------------------------------------
// Property-mode mock data
// ---------------------------------------------------------------------------

export type MockProperty = {
  id: string;
  name: string;
  type: string;
  description: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  latitude: string;
  longitude: string;
  branding: {
    logoUrl?: string;
    accentColor: string;
    welcomeText: string;
    termsAndConditions: string;
  };
  tax: {
    taxRate: number;
    taxType: "inclusive" | "exclusive";
    taxLabel: string;
    gstin: string;
  };
  policies: {
    checkInTime: string;
    checkOutTime: string;
    idVerificationRequired: boolean;
    cancellationPolicy: "free" | "moderate" | "strict";
    cancellationDeadlineHours: number;
    refundPercent: number;
  };
  houseRules: {
    rulesText: string;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    eventsAllowed: boolean;
    securityDepositAmount: string;
  };
  gatewayId: string | null;
  status: "active" | "deactivated" | "archived";
};

export const MOCK_PROPERTIES: MockProperty[] = [
  {
    id: "prop-1",
    name: "Sunrise Villa - Goa",
    type: "Villa",
    description:
      "A beachfront 4-bedroom villa with a private pool, ideal for family getaways and small events.",
    addressLine1: "Vagator Beach Road",
    city: "Vagator",
    state: "Goa",
    country: "India",
    pin: "403509",
    latitude: "15.5989",
    longitude: "73.7411",
    branding: {
      accentColor: "#0f766e",
      welcomeText: "Welcome to Sunrise Villa — your beachfront escape in Goa.",
      termsAndConditions:
        "Standard booking terms apply. No refunds on non-refundable rates.",
    },
    tax: {
      taxRate: 12,
      taxType: "exclusive",
      taxLabel: "GST",
      gstin: "30AABCS1234A1ZV",
    },
    policies: {
      checkInTime: "14:00",
      checkOutTime: "11:00",
      idVerificationRequired: true,
      cancellationPolicy: "moderate",
      cancellationDeadlineHours: 48,
      refundPercent: 50,
    },
    houseRules: {
      rulesText:
        "No loud music after 10 PM. Maximum occupancy 8 guests. Outside catering allowed with prior approval.",
      petsAllowed: true,
      smokingAllowed: false,
      eventsAllowed: true,
      securityDepositAmount: "₹5,000",
    },
    gatewayId: "razorpay",
    status: "active",
  },
  {
    id: "prop-2",
    name: "Hilltop Retreat",
    type: "Resort",
    description:
      "A hillside retreat with 12 cottages, spa services, and panoramic valley views.",
    addressLine1: "Coonoor-Ooty Road",
    city: "Coonoor",
    state: "Tamil Nadu",
    country: "India",
    pin: "643101",
    latitude: "11.3529",
    longitude: "76.7951",
    branding: {
      accentColor: "#7c3aed",
      welcomeText: "Escape to the hills at Hilltop Retreat.",
      termsAndConditions: "Advance payment of 30% required to confirm booking.",
    },
    tax: {
      taxRate: 18,
      taxType: "inclusive",
      taxLabel: "GST",
      gstin: "33AABCS1234A1ZX",
    },
    policies: {
      checkInTime: "13:00",
      checkOutTime: "10:00",
      idVerificationRequired: true,
      cancellationPolicy: "strict",
      cancellationDeadlineHours: 72,
      refundPercent: 25,
    },
    houseRules: {
      rulesText:
        "Smoking permitted only in designated outdoor areas. No pets allowed.",
      petsAllowed: false,
      smokingAllowed: true,
      eventsAllowed: false,
      securityDepositAmount: "₹3,000",
    },
    gatewayId: "razorpay",
    status: "active",
  },
  {
    id: "prop-3",
    name: "Lakeside Cottage",
    type: "Cottage",
    description:
      "A cozy 2-bedroom cottage on the edge of Nainital lake, perfect for couples and small families.",
    addressLine1: "Mallital Lakeside Road",
    city: "Nainital",
    state: "Uttarakhand",
    country: "India",
    pin: "263001",
    latitude: "29.3803",
    longitude: "79.4636",
    branding: {
      accentColor: "#b45309",
      welcomeText: "Unwind by the lake at Lakeside Cottage.",
      termsAndConditions: "Free cancellation up to 24 hours before check-in.",
    },
    tax: {
      taxRate: 12,
      taxType: "exclusive",
      taxLabel: "GST",
      gstin: "05AABCS1234A1ZY",
    },
    policies: {
      checkInTime: "12:00",
      checkOutTime: "10:00",
      idVerificationRequired: false,
      cancellationPolicy: "free",
      cancellationDeadlineHours: 24,
      refundPercent: 100,
    },
    houseRules: {
      rulesText: "No smoking indoors. Quiet hours after 9 PM.",
      petsAllowed: true,
      smokingAllowed: false,
      eventsAllowed: false,
      securityDepositAmount: "₹1,500",
    },
    gatewayId: null,
    status: "active",
  },
];

export function getMockProperty(propertyId: string | undefined) {
  return MOCK_PROPERTIES.find((p) => p.id === propertyId) ?? MOCK_PROPERTIES[0];
}
