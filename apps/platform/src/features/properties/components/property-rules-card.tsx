import { Badge } from "@propertyos/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { ChevronRightIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { api } from "@/shared/lib/api-client";
import { useDeletePropertyRule } from "../api/use-delete-property-rule";
import { usePropertyRules } from "../api/use-property-rules";
import {
  PROPERTY_RULE_CATEGORY_DESCRIPTION,
  PROPERTY_RULE_CATEGORY_LABEL,
  PROPERTY_RULE_CATEGORY_OPTIONAL,
  type PropertyRuleCategory,
  propertyRuleCategoryValues,
} from "../lib/property-rule";
import { PropertyRuleDialog } from "./property-rule-dialog";

export function PropertyRulesCard({ propertyId }: { propertyId: string }) {
  const feedback = useFeedback();
  const { data: response, isLoading } = usePropertyRules(propertyId);
  const rules = response?.data ?? [];
  const deleteRule = useDeletePropertyRule();

  const [activeCategory, setActiveCategory] =
    useState<PropertyRuleCategory | null>(null);

  function findRule(category: PropertyRuleCategory) {
    return rules.find((rule) => rule.category === category);
  }

  function handleDelete(category: PropertyRuleCategory) {
    deleteRule.mutate(
      { param: { id: propertyId, category } },
      {
        onSuccess: () => {
          api.api.platform.properties[":id"].rules.$get.invalidate({
            param: { id: propertyId },
          });
          feedback.success(
            "Rule removed",
            `${PROPERTY_RULE_CATEGORY_LABEL[category]} has been cleared.`,
          );
        },
        onError: () => {
          feedback.error(
            "Couldn't remove rule",
            "Something went wrong. Please try again.",
          );
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Rules & Policies</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y border">
            {propertyRuleCategoryValues.map((category) => {
              const rule = findRule(category);
              const isOptional = PROPERTY_RULE_CATEGORY_OPTIONAL[category];

              return (
                <div
                  key={category}
                  className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">
                        {PROPERTY_RULE_CATEGORY_LABEL[category]}
                      </span>
                      {isOptional && <Badge variant="outline">Optional</Badge>}
                      {rule ? (
                        <Badge variant="outline">Added</Badge>
                      ) : (
                        !isOptional && (
                          <Badge variant="destructive">Not set</Badge>
                        )
                      )}
                    </div>
                    <span className="truncate text-muted-foreground text-xs">
                      {PROPERTY_RULE_CATEGORY_DESCRIPTION[category]}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {rule && (
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="flex size-7 items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className="flex size-7 items-center justify-center text-muted-foreground"
                    >
                      <ChevronRightIcon className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {activeCategory && (
        <PropertyRuleDialog
          open={Boolean(activeCategory)}
          onOpenChange={(open) => {
            if (!open) setActiveCategory(null);
          }}
          propertyId={propertyId}
          category={activeCategory}
          initialContent={findRule(activeCategory)?.content ?? ""}
        />
      )}
    </Card>
  );
}
