import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "./admin-empty-state";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

type Pagination = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type AdminDataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  pagination?: Pagination;
  className?: string;
};

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "Không có dữ liệu",
  pagination,
  className,
}: AdminDataTableProps<T>) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wide h-9"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <AdminEmptyState message={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow key={rowIdx} className="hover:bg-[var(--admin-sidebar-accent)]">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sm text-[var(--admin-text-primary)] py-2.5">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[var(--admin-text-secondary)]">
            Trang {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="h-7 text-xs"
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="h-7 text-xs"
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
