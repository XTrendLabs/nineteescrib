export const propertyRuleCategoryValues = [
  "property_rules",
  "cancellation_policy",
  "damage_policy",
  "checkin_checkout_instructions",
] as const;

export type PropertyRuleCategory = (typeof propertyRuleCategoryValues)[number];

export const PROPERTY_RULE_CATEGORY_LABEL: Record<
  PropertyRuleCategory,
  string
> = {
  property_rules: "Property Rules",
  cancellation_policy: "Cancellation Policy",
  damage_policy: "Damage Policy",
  checkin_checkout_instructions: "Check-in / Check-out Instructions",
};

export const PROPERTY_RULE_CATEGORY_DESCRIPTION: Record<
  PropertyRuleCategory,
  string
> = {
  property_rules: "House rules, dos and don'ts for guests staying here.",
  cancellation_policy: "Refund and cancellation terms for bookings.",
  damage_policy: "What happens if property or furnishings are damaged.",
  checkin_checkout_instructions:
    "Arrival and departure instructions for guests.",
};

export const PROPERTY_RULE_CATEGORY_OPTIONAL: Record<
  PropertyRuleCategory,
  boolean
> = {
  property_rules: false,
  cancellation_policy: false,
  damage_policy: true,
  checkin_checkout_instructions: true,
};

export type PropertyRule = {
  id: string;
  /** The property's organization id. */
  organizationId: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizePropertyRuleCategory(
  value: string,
): PropertyRuleCategory {
  return propertyRuleCategoryValues.includes(value as PropertyRuleCategory)
    ? (value as PropertyRuleCategory)
    : "property_rules";
}
