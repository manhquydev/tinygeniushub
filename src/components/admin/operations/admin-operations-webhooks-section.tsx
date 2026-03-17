"use client";

import { webhookStatuses } from "./admin-operations-constants";
import { getWebhookStatusLabel, getWebhookStatusPillClass } from "./admin-operations-utils";
import type { WebhookRow } from "./admin-operations-types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminOperationsWebhooksSectionProps = {
  webhookStatus: (typeof webhookStatuses)[number];
  loadingWebhooks: boolean;
  webhooks: WebhookRow[];
  onWebhookStatusChange: (next: (typeof webhookStatuses)[number]) => void;
  onRefreshWebhooks: () => Promise<void>;
};

export function AdminOperationsWebhooksSection(props: AdminOperationsWebhooksSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <p className="text-xs text-slate-500 mb-1">Trạng thái webhook</p>
          <Select value={props.webhookStatus} onValueChange={(v) => props.onWebhookStatusChange(v as (typeof webhookStatuses)[number])}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {webhookStatuses.map((status) => (
                <SelectItem key={status} value={status} className="text-xs">{getWebhookStatusLabel(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => void props.onRefreshWebhooks()} disabled={props.loadingWebhooks} className="h-8 text-xs">
          {props.loadingWebhooks ? "Đang tải..." : "Làm mới webhook"}
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Nhà cung cấp</TableHead>
              <TableHead className="text-xs">Sự kiện</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Chữ ký</TableHead>
              <TableHead className="text-xs">Lỗi</TableHead>
              <TableHead className="text-xs">Thời điểm tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.webhooks.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-xs">{event.provider}</TableCell>
                <TableCell className="text-xs font-mono">{event.eventId}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", getWebhookStatusPillClass(event.status))}>
                    {getWebhookStatusLabel(event.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{event.signatureValid ? "Hợp lệ" : "Không hợp lệ"}</TableCell>
                <TableCell className="text-xs text-slate-500">{event.errorMessage ?? "-"}</TableCell>
                <TableCell className="text-xs">{new Date(event.createdAt).toLocaleString("vi-VN")}</TableCell>
              </TableRow>
            ))}
            {props.webhooks.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-slate-500 py-6">Chưa có bản ghi webhook.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
