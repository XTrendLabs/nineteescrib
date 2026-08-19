import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";

import type { ReportTemplate } from "../lib/mock-data";

export function TemplateCard({
  template,
  index,
  onRun,
}: {
  template: ReportTemplate;
  index: number;
  onRun: (template: ReportTemplate) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 220,
        damping: 26,
      }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-3 pt-4">
          <div className="flex items-start gap-2.5">
            <span className="text-lg leading-none">{template.emoji}</span>
            <p className="font-medium text-sm leading-tight">{template.name}</p>
          </div>
          <p className="flex-1 text-muted-foreground text-xs leading-relaxed">
            {template.description}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onRun(template)}
          >
            Run Report
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
