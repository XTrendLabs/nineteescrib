/**
 * Structured mock data for the Reports & Analytics module.
 *
 * No reports schema exists yet (see docs/reports_design.md §7 for the
 * proposed custom_reports / scheduled_reports tables), so the template
 * catalog, saved reports, schedules, and generated report rows are all
 * deterministic (seeded-hash, no Math.random), following the same pattern
 * as bookings/guests/properties lib/mock-data.ts.
 */

import { addDays, subDays } from "date-fns";

export type ReportCategory =
  | "finance"
  | "channel_roi"
  | "occupancy"
  | "operations"
  | "guest_crm";

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  finance: "Financial & Tax",
  channel_roi: "Direct Booking & Channel ROI",
  occupancy: "Occupancy & Inventory",
  operations: "Staff & Operations",
  guest_crm: "Guest CRM & Retention",
};

export type ExportFormat = "csv" | "excel" | "pdf";

export type ReportTemplate = {
  key: string;
  name: string;
  emoji: string;
  category: ReportCategory;
  description: string;
  metrics: string[];
  exportFormats: ExportFormat[];
  columns: string[];
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    key: "revenue_yield",
    name: "Revenue & Yield (RevPAR)",
    emoji: "📊",
    category: "finance",
    description:
      "ADR, RevPAR, total booked vs collected revenue across your portfolio.",
    metrics: ["Total Revenue", "ADR", "RevPAR", "Paid vs Due Balance"],
    exportFormats: ["csv", "excel", "pdf"],
    columns: ["Property", "Total Revenue", "ADR", "RevPAR", "Paid", "Due"],
  },
  {
    key: "tax_gst",
    name: "Tax & GST Compliance",
    emoji: "🧾",
    category: "finance",
    description: "GST-shaped export for your accountant (inclusive/exclusive).",
    metrics: ["Taxable Base", "Exclusive GST", "Inclusive GST", "Vendor ITC"],
    exportFormats: ["csv", "excel"],
    columns: [
      "Property",
      "Taxable Base",
      "Exclusive GST",
      "Inclusive GST",
      "Vendor ITC",
    ],
  },
  {
    key: "profit_loss",
    name: "Profit & Loss (P&L)",
    emoji: "📈",
    category: "finance",
    description: "Gross booking revenue minus operating expenses = net yield.",
    metrics: ["Gross Revenue", "Operating Expenses", "Net Yield"],
    exportFormats: ["pdf", "excel"],
    columns: ["Property", "Gross Revenue", "Expenses", "Net Yield"],
  },
  {
    key: "direct_savings",
    name: "Direct Savings vs OTAs",
    emoji: "🎯",
    category: "channel_roi",
    description: "Proves commission kept in your pocket.",
    metrics: ["Direct Revenue %", "Commissions Saved"],
    exportFormats: ["pdf", "csv"],
    columns: ["Property", "Direct Revenue %", "Commissions Saved"],
  },
  {
    key: "coupon_promo",
    name: "Coupon & Promo Yield",
    emoji: "🏷️",
    category: "channel_roi",
    description: "Track discount code conversion rates.",
    metrics: ["Codes Used", "Total Discount", "Net Revenue"],
    exportFormats: ["csv"],
    columns: ["Code", "Uses", "Total Discount", "Net Revenue"],
  },
  {
    key: "occupancy_heatmap",
    name: "Occupancy Heatmap",
    emoji: "🏨",
    category: "occupancy",
    description: "Nightly occupancy rates across all properties.",
    metrics: ["Nightly Occupancy %", "Peak Weekend Demand", "Unsold Units"],
    exportFormats: ["csv", "pdf"],
    columns: ["Property", "Occupancy %", "Peak Weekend", "Unsold Units"],
  },
  {
    key: "room_type_performance",
    name: "Room Type Performance",
    emoji: "🛌",
    category: "occupancy",
    description: "Revenue & nights sold per room category.",
    metrics: ["Revenue per Category", "Avg Stay Duration", "Turnover Rate"],
    exportFormats: ["excel", "csv"],
    columns: ["Room Type", "Revenue", "Avg Stay (nights)", "Turnover Rate"],
  },
  {
    key: "staff_attendance",
    name: "Staff Attendance Summary",
    emoji: "👥",
    category: "operations",
    description: "Monthly work days & leave records for payroll.",
    metrics: ["Days Present", "Absences", "On-Leave", "Half Days"],
    exportFormats: ["excel", "csv"],
    columns: ["Staff", "Present", "Absent", "On Leave", "Half Days"],
  },
  {
    key: "operational_audit",
    name: "Operational Audit Log",
    emoji: "📋",
    category: "operations",
    description: "Action history across all caretaker events.",
    metrics: ["Event History"],
    exportFormats: ["csv"],
    columns: ["Timestamp", "Event", "Actor", "Property"],
  },
  {
    key: "repeat_guest_ltv",
    name: "Repeat Guest LTV",
    emoji: "👑",
    category: "guest_crm",
    description: "High-value guest ranking and stay frequencies.",
    metrics: ["Lifetime Spend", "Total Stays", "Last Visit"],
    exportFormats: ["csv"],
    columns: ["Guest", "Lifetime Spend", "Stays", "Last Visit"],
  },
  {
    key: "channel_source_breakdown",
    name: "Channel Source Breakdown",
    emoji: "🌐",
    category: "guest_crm",
    description: "Distribution of Airbnb vs Direct vs Booking.com.",
    metrics: ["% Share by Channel"],
    exportFormats: ["pdf", "csv"],
    columns: ["Channel", "Bookings", "Revenue", "Share %"],
  },
];

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

export type MockProperty = { id: string; name: string };

const FALLBACK_PROPERTIES: MockProperty[] = [
  { id: "fallback-1", name: "Sunrise Villa - Goa" },
  { id: "fallback-2", name: "Coorg Retreat" },
  { id: "fallback-3", name: "City Nest - Bengaluru" },
];

export function resolveReportsProperties(
  properties: MockProperty[] | undefined,
): MockProperty[] {
  if (properties && properties.length > 0) {
    return properties.slice(0, 6);
  }
  return FALLBACK_PROPERTIES;
}

export type ReportRow = Record<string, string | number>;

/**
 * Generates a deterministic result grid for a given template + property set.
 * Column shape follows the template's `columns` field so the preview table
 * can render generically without per-report bespoke components.
 */
export function buildReportRows(
  template: ReportTemplate,
  properties: MockProperty[],
): ReportRow[] {
  const rand = seededRandom(
    `report-${template.key}-${properties.map((p) => p.id).join(",")}`,
  );

  return properties.map((property) => {
    const row: ReportRow = {};
    for (const column of template.columns) {
      if (
        column === "Property" ||
        column === "Room Type" ||
        column === "Staff" ||
        column === "Guest" ||
        column === "Code" ||
        column === "Channel"
      ) {
        row[column] = property.name;
        continue;
      }
      if (column === "Timestamp") {
        row[column] = subDays(
          new Date(),
          Math.floor(rand() * 14),
        ).toLocaleDateString("en-IN");
        continue;
      }
      if (column === "Event") {
        const events = [
          "Check-in",
          "Cancellation",
          "Price Override",
          "Check-out",
        ];
        row[column] = events[Math.floor(rand() * events.length)];
        continue;
      }
      if (column === "Actor") {
        row[column] = ["Front Desk", "System", "Manager"][
          Math.floor(rand() * 3)
        ];
        continue;
      }
      if (column === "Last Visit") {
        row[column] = subDays(
          new Date(),
          Math.floor(rand() * 90),
        ).toLocaleDateString("en-IN");
        continue;
      }
      if (column.includes("%") || column.includes("Rate")) {
        row[column] = Math.round(30 + rand() * 60);
        continue;
      }
      if (
        column.includes("Stay") ||
        column.includes("Days") ||
        column.includes("Present") ||
        column.includes("Absent") ||
        column.includes("Leave") ||
        column.includes("Bookings") ||
        column.includes("Uses") ||
        column.includes("Stays") ||
        column.includes("Units")
      ) {
        row[column] = Math.round(rand() * 30);
        continue;
      }
      // default: currency-shaped paise value
      row[column] = Math.round((5000 + rand() * 350000) * 100);
    }
    return row;
  });
}

export const CURRENCY_COLUMNS = new Set([
  "Total Revenue",
  "ADR",
  "RevPAR",
  "Paid",
  "Due",
  "Taxable Base",
  "Exclusive GST",
  "Inclusive GST",
  "Vendor ITC",
  "Gross Revenue",
  "Expenses",
  "Net Yield",
  "Commissions Saved",
  "Total Discount",
  "Net Revenue",
  "Revenue",
  "Lifetime Spend",
]);

// ---------------------------------------------------------------------------
// Custom Report Builder (Pro tier)
// ---------------------------------------------------------------------------

export type BuilderMetricKey =
  | "total_revenue"
  | "occupancy_percent"
  | "adr"
  | "revpar"
  | "commission_saved"
  | "expenses"
  | "tax_amount"
  | "guest_count"
  | "length_of_stay";

export const BUILDER_METRICS: { key: BuilderMetricKey; label: string }[] = [
  { key: "total_revenue", label: "Total Revenue" },
  { key: "occupancy_percent", label: "Occupancy %" },
  { key: "adr", label: "ADR" },
  { key: "revpar", label: "RevPAR" },
  { key: "commission_saved", label: "Commission Saved" },
  { key: "expenses", label: "Expenses" },
  { key: "tax_amount", label: "Tax Amount" },
  { key: "guest_count", label: "Guest Count" },
  { key: "length_of_stay", label: "Length of Stay" },
];

export type BuilderDimension =
  | "property"
  | "room_type"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "channel"
  | "staff";

export const BUILDER_DIMENSIONS: { key: BuilderDimension; label: string }[] = [
  { key: "property", label: "Property" },
  { key: "room_type", label: "Room Type" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "channel", label: "Channel Source" },
  { key: "staff", label: "Staff Member" },
];

export type Visualization = "table" | "bar_chart" | "line_graph" | "cards";

export type RelativeDateRange =
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "previous_quarter"
  | "year_to_date";

export const RELATIVE_DATE_OPTIONS: {
  value: RelativeDateRange;
  label: string;
}[] = [
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter (Q3 2025)" },
  { value: "previous_quarter", label: "Previous Quarter" },
  { value: "year_to_date", label: "Year to Date" },
];

/**
 * A single table/chart in the builder's preview grid. The overall report can
 * grow into a "big report" by adding more blocks — each one picks its own
 * metrics + visualization but shares the parent config's dimensions/filters.
 */
export type PreviewBlock = {
  id: string;
  title: string;
  metrics: BuilderMetricKey[];
  visualization: Visualization;
};

export type BuilderConfig = {
  metrics: BuilderMetricKey[];
  primaryDimension: BuilderDimension;
  secondaryDimension: BuilderDimension | null;
  dateRange: RelativeDateRange;
  propertyIds: string[];
  channels: string[];
  visualization: Visualization;
  blocks: PreviewBlock[];
};

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = {
  metrics: ["total_revenue", "occupancy_percent", "adr", "commission_saved"],
  primaryDimension: "property",
  secondaryDimension: "month",
  dateRange: "this_quarter",
  propertyIds: [],
  channels: ["direct", "airbnb"],
  visualization: "table",
  blocks: [
    {
      id: "block-1",
      title: "Revenue by Property × Month",
      metrics: [
        "total_revenue",
        "occupancy_percent",
        "adr",
        "commission_saved",
      ],
      visualization: "table",
    },
  ],
};

export type SavedReport = {
  id: string;
  name: string;
  config: BuilderConfig;
  savedByName: string;
  savedAt: Date;
};

export function buildSavedReports(properties: MockProperty[]): SavedReport[] {
  const rand = seededRandom(
    `saved-reports-${properties.map((p) => p.id).join(",")}`,
  );

  return [
    {
      id: "saved-1",
      name: `${properties[0]?.name.split(" ")[0] ?? "Portfolio"}'s Monthly Payout`,
      config: {
        metrics: ["total_revenue", "adr", "commission_saved"],
        primaryDimension: "property",
        secondaryDimension: "month",
        dateRange: "this_quarter",
        propertyIds: properties.slice(0, 1).map((p) => p.id),
        channels: ["direct"],
        visualization: "table",
        blocks: [
          {
            id: "block-1",
            title: "Revenue by Property × Month",
            metrics: ["total_revenue", "adr", "commission_saved"],
            visualization: "table",
          },
        ],
      },
      savedByName: "Meera",
      savedAt: subDays(new Date(), 3 + Math.floor(rand() * 3)),
    },
    {
      id: "saved-2",
      name: "Weekend Surge vs Direct Share",
      config: {
        metrics: ["revpar", "total_revenue"],
        primaryDimension: "day",
        secondaryDimension: "channel",
        dateRange: "last_30_days",
        propertyIds: properties.slice(0, 2).map((p) => p.id),
        channels: ["direct", "airbnb", "booking_com"],
        visualization: "bar_chart",
        blocks: [
          {
            id: "block-1",
            title: "RevPAR by Day",
            metrics: ["revpar"],
            visualization: "bar_chart",
          },
          {
            id: "block-2",
            title: "Total Revenue by Channel",
            metrics: ["total_revenue"],
            visualization: "line_graph",
          },
        ],
      },
      savedByName: "Bikram",
      savedAt: subDays(new Date(), 14 + Math.floor(rand() * 5)),
    },
  ];
}

export function buildBuilderPreviewRows(
  metrics: BuilderMetricKey[],
  propertyIds: string[],
  properties: MockProperty[],
): {
  group: string;
  rows: { label: string; values: Record<BuilderMetricKey, number> }[];
}[] {
  const scopedProperties =
    propertyIds.length > 0
      ? properties.filter((p) => propertyIds.includes(p.id))
      : properties;

  const rand = seededRandom(
    `builder-${metrics.join(",")}-${scopedProperties.map((p) => p.id).join(",")}`,
  );

  const months = ["July 2025", "August 2025"];

  return scopedProperties.map((property) => ({
    group: property.name,
    rows: months.map((month) => {
      const values = {} as Record<BuilderMetricKey, number>;
      for (const metric of metrics) {
        if (metric === "occupancy_percent") {
          values[metric] = Math.round(55 + rand() * 35);
        } else if (metric === "guest_count" || metric === "length_of_stay") {
          values[metric] = Math.round(1 + rand() * 8);
        } else {
          values[metric] = Math.round((15000 + rand() * 300000) * 100);
        }
      }
      return { label: month, values };
    }),
  }));
}

// ---------------------------------------------------------------------------
// Scheduled Email Exports
// ---------------------------------------------------------------------------

export type ScheduleFrequency = "daily" | "weekly" | "monthly";
export type ScheduleStatus = "active" | "paused";

export type ScheduledReport = {
  id: string;
  label: string;
  templateKey: string | null;
  savedReportId: string | null;
  format: ExportFormat | "excel_csv";
  frequency: ScheduleFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  recipients: string[];
  status: ScheduleStatus;
  nextRunAt: Date;
};

export function buildScheduledReports(): ScheduledReport[] {
  return [
    {
      id: "sched-1",
      label: "Weekly Revenue & Occupancy Summary",
      templateKey: "revenue_yield",
      savedReportId: null,
      format: "excel_csv",
      frequency: "weekly",
      dayOfWeek: 1,
      dayOfMonth: null,
      timeOfDay: "09:00",
      recipients: ["owner@sunriseretreats.in"],
      status: "active",
      nextRunAt: addDays(new Date(), (8 - new Date().getDay()) % 7 || 7),
    },
    {
      id: "sched-2",
      label: "Monthly Tax & GST Compliance Package",
      templateKey: "tax_gst",
      savedReportId: null,
      format: "excel",
      frequency: "monthly",
      dayOfWeek: null,
      dayOfMonth: 1,
      timeOfDay: "08:00",
      recipients: ["ca@sunriseretreats.in", "accountant@email.com"],
      status: "active",
      nextRunAt: addDays(new Date(), 30 - new Date().getDate() + 1),
    },
  ];
}

export const DAY_OF_WEEK_LABELS = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ---------------------------------------------------------------------------
// Advanced Report Templates (Pro) — richer multi-section/nested-table layouts
// ---------------------------------------------------------------------------

export type AdvancedTemplateKey =
  | "portfolio_dashboard"
  | "property_pnl_breakdown"
  | "channel_performance_matrix";

export type NestedTableSection = {
  type: "nested_table";
  title: string;
  groupLabel: string;
  columns: string[];
  groups: { group: string; rows: ReportRow[]; subtotal?: ReportRow }[];
};

export type StatsSection = {
  type: "stats";
  title: string;
  stats: { label: string; value: string }[];
};

export type FlatTableSection = {
  type: "flat_table";
  title: string;
  columns: string[];
  rows: ReportRow[];
};

export type AdvancedSection =
  | NestedTableSection
  | StatsSection
  | FlatTableSection;

export type AdvancedTemplate = {
  key: AdvancedTemplateKey;
  name: string;
  emoji: string;
  description: string;
  buildSections: (properties: MockProperty[]) => AdvancedSection[];
};

export const ADVANCED_TEMPLATES: AdvancedTemplate[] = [
  {
    key: "portfolio_dashboard",
    name: "Portfolio Performance Dashboard",
    emoji: "🗂️",
    description:
      "Multi-table view: portfolio KPIs, then per-property revenue broken down by room type.",
    buildSections: (properties) => {
      const rand = seededRandom(
        `adv-portfolio-${properties.map((p) => p.id).join(",")}`,
      );
      const totalRevenue = properties.reduce(
        (sum) => sum + Math.round((150000 + rand() * 400000) * 100),
        0,
      );

      return [
        {
          type: "stats",
          title: "Portfolio KPIs",
          stats: [
            {
              label: "Total Revenue",
              value: formatPaiseForDisplay(totalRevenue),
            },
            {
              label: "Blended Occupancy",
              value: `${Math.round(55 + rand() * 30)}%`,
            },
            { label: "Properties", value: String(properties.length) },
            {
              label: "Avg RevPAR",
              value: formatPaiseForDisplay(
                Math.round((2000 + rand() * 3000) * 100),
              ),
            },
          ],
        },
        {
          type: "nested_table",
          title: "Revenue by Property × Room Type",
          groupLabel: "Property",
          columns: ["Room Type", "Nights Sold", "Revenue", "ADR"],
          groups: properties.map((property) => {
            const roomTypes = [
              "Standard Room",
              "Deluxe Suite",
              "Entire Villa",
            ].slice(0, 1 + Math.floor(rand() * 3));
            const rows = roomTypes.map((rt) => {
              const nights = Math.round(5 + rand() * 25);
              const revenue = Math.round((3000 + rand() * 8000) * 100 * nights);
              return {
                "Room Type": rt,
                "Nights Sold": nights,
                Revenue: revenue,
                ADR: Math.round(revenue / Math.max(nights, 1)),
              };
            });
            const subtotalRevenue = rows.reduce(
              (sum, r) => sum + (r.Revenue as number),
              0,
            );
            return {
              group: property.name,
              rows,
              subtotal: {
                "Room Type": "Subtotal",
                "Nights Sold": "",
                Revenue: subtotalRevenue,
                ADR: "",
              },
            };
          }),
        },
      ];
    },
  },
  {
    key: "property_pnl_breakdown",
    name: "Property P&L Breakdown",
    emoji: "📑",
    description:
      "Nested profit & loss statement per property, with expense line items rolled up to net yield.",
    buildSections: (properties) => {
      const rand = seededRandom(
        `adv-pnl-${properties.map((p) => p.id).join(",")}`,
      );
      const expenseLines = [
        "Cleaning & Housekeeping",
        "Utilities",
        "OTA Commission",
        "Maintenance",
        "Staff Payroll",
      ];

      return [
        {
          type: "nested_table",
          title: "Profit & Loss by Property",
          groupLabel: "Property",
          columns: ["Line Item", "Amount"],
          groups: properties.map((property) => {
            const grossRevenue = Math.round((180000 + rand() * 350000) * 100);
            const rows: ReportRow[] = expenseLines.map((line) => ({
              "Line Item": line,
              Amount: -Math.round((8000 + rand() * 35000) * 100),
            }));
            rows.unshift({
              "Line Item": "Gross Booking Revenue",
              Amount: grossRevenue,
            });
            const netYield = rows.reduce(
              (sum, r) => sum + (r.Amount as number),
              0,
            );
            return {
              group: property.name,
              rows,
              subtotal: { "Line Item": "Net Yield", Amount: netYield },
            };
          }),
        },
      ];
    },
  },
  {
    key: "channel_performance_matrix",
    name: "Channel Performance Matrix",
    emoji: "🧭",
    description:
      "Multi-table breakdown of bookings and revenue per channel, nested under each property.",
    buildSections: (properties) => {
      const rand = seededRandom(
        `adv-channel-${properties.map((p) => p.id).join(",")}`,
      );
      const channels = ["Direct", "Airbnb", "Booking.com", "Manual"];

      return [
        {
          type: "stats",
          title: "Channel Mix Summary",
          stats: [
            {
              label: "Direct Share",
              value: `${Math.round(35 + rand() * 30)}%`,
            },
            {
              label: "Commission Saved",
              value: formatPaiseForDisplay(
                Math.round((40000 + rand() * 90000) * 100),
              ),
            },
            {
              label: "Total Bookings",
              value: String(Math.round(60 + rand() * 200)),
            },
          ],
        },
        {
          type: "nested_table",
          title: "Bookings & Revenue by Property × Channel",
          groupLabel: "Property",
          columns: ["Channel", "Bookings", "Revenue", "Share %"],
          groups: properties.map((property) => {
            const rows = channels.map((channel) => {
              const bookings = Math.round(3 + rand() * 25);
              return {
                Channel: channel,
                Bookings: bookings,
                Revenue: Math.round((2500 + rand() * 6000) * 100 * bookings),
                "Share %": Math.round(10 + rand() * 40),
              };
            });
            return { group: property.name, rows };
          }),
        },
      ];
    },
  },
];

function formatPaiseForDisplay(valuePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valuePaise / 100);
}
