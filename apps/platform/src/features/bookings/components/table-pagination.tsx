import { Button } from "@propertyos/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue>{(value: unknown) => value as string}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          {total === 0 ? "0 results" : `${start}–${end} of ${total}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-14 text-center text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
