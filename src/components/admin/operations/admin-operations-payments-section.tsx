"use client";

import { Fragment } from "react";
import { paymentStatuses, reconcileActions, reconcileWebhookResolutions } from "./admin-operations-constants";
import { getPaymentStatusLabel, getPaymentStatusPillClass, getReconcileActionLabel, getWebhookResolutionLabel, matchWebhookToPayment } from "./admin-operations-utils";
import type { PaymentRow, ReconcileAction, ReconcileWebhookResolution, WebhookRow } from "./admin-operations-types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminOperationsPaymentsSectionProps = {
  paymentStatus: (typeof paymentStatuses)[number];
  loadingPayments: boolean;
  payments: PaymentRow[];
  webhooks: WebhookRow[];
  openReconcilePaymentId: string | null;
  reconcilingPaymentId: string | null;
  reconcileAction: ReconcileAction;
  reconcileWebhookResolution: ReconcileWebhookResolution;
  reconcileWebhookId: string;
  reconcileNote: string;
  onPaymentStatusChange: (next: (typeof paymentStatuses)[number]) => void;
  onRefreshPayments: () => Promise<void>;
  onToggleReconcilePanel: (paymentId: string) => void;
  onReconcileActionChange: (next: ReconcileAction) => void;
  onReconcileWebhookResolutionChange: (next: ReconcileWebhookResolution) => void;
  onReconcileWebhookIdChange: (next: string) => void;
  onReconcileNoteChange: (next: string) => void;
  onSubmitReconcile: (payment: PaymentRow) => Promise<void>;
  onCloseReconcile: () => void;
};

export function AdminOperationsPaymentsSection(props: AdminOperationsPaymentsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <p className="text-xs text-slate-500 mb-1">Trạng thái thanh toán</p>
          <Select value={props.paymentStatus} onValueChange={(v) => props.onPaymentStatusChange(v as (typeof paymentStatuses)[number])}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentStatuses.map((status) => (
                <SelectItem key={status} value={status} className="text-xs">{getPaymentStatusLabel(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => void props.onRefreshPayments()} disabled={props.loadingPayments} className="h-8 text-xs">
          {props.loadingPayments ? "Đang tải..." : "Làm mới giao dịch"}
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs">Phụ huynh</TableHead>
              <TableHead className="text-xs">Cổng</TableHead>
              <TableHead className="text-xs">Mã giao dịch</TableHead>
              <TableHead className="text-xs">Số tiền</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Thời điểm</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.payments.map((payment) => {
              const isOpen = props.openReconcilePaymentId === payment.id;
              const relatedWebhooks = props.webhooks.filter((e) => matchWebhookToPayment(payment, e));
              const isReconciling = props.reconcilingPaymentId === payment.id;
              return (
                <Fragment key={payment.id}>
                  <TableRow>
                    <TableCell className="text-xs">{payment.parent.email}</TableCell>
                    <TableCell className="text-xs">{payment.provider}</TableCell>
                    <TableCell className="text-xs font-mono">{payment.providerTransactionId}</TableCell>
                    <TableCell className="text-xs">{payment.amountVnd.toLocaleString("vi-VN")} {payment.currency}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", getPaymentStatusPillClass(payment.status))}>
                        {getPaymentStatusLabel(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(payment.processedAt).toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => props.onToggleReconcilePanel(payment.id)} disabled={isReconciling} className="h-6 text-xs">
                        {isOpen ? "Đóng" : "Đối soát"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-slate-50">
                        <div className="p-3 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Hành động</p>
                              <Select value={props.reconcileAction} onValueChange={(v) => props.onReconcileActionChange(v as ReconcileAction)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {reconcileActions.map((a) => <SelectItem key={a} value={a} className="text-xs">{getReconcileActionLabel(a)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Cập nhật webhook</p>
                              <Select value={props.reconcileWebhookResolution} onValueChange={(v) => props.onReconcileWebhookResolutionChange(v as ReconcileWebhookResolution)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE" className="text-xs">Không cập nhật</SelectItem>
                                  {reconcileWebhookResolutions.filter((v): v is Exclude<ReconcileWebhookResolution, "NONE"> => v !== "NONE").map((v) => (
                                    <SelectItem key={v} value={v} className="text-xs">{getWebhookResolutionLabel(v)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-slate-500 mb-1">Chọn webhook liên quan</p>
                              <Select value={props.reconcileWebhookId} onValueChange={props.onReconcileWebhookIdChange} disabled={props.reconcileWebhookResolution === "NONE"}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-- Chọn sự kiện webhook --" /></SelectTrigger>
                                <SelectContent>
                                  {relatedWebhooks.map((e) => <SelectItem key={e.id} value={e.id} className="text-xs">{e.eventId} ({e.status})</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-slate-500 mb-1">Ghi chú vận hành</p>
                              <Textarea value={props.reconcileNote} onChange={(e) => props.onReconcileNoteChange(e.target.value)} placeholder="Ví dụ: webhook về trễ..." rows={2} className="text-xs" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void props.onSubmitReconcile(payment)} disabled={isReconciling} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                              {isReconciling ? "Đang đối soát..." : "Thực hiện đối soát"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={props.onCloseReconcile} disabled={isReconciling} className="h-7 text-xs">Hủy</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {props.payments.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-slate-500 py-6">Chưa có bản ghi thanh toán.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
