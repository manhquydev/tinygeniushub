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
          <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Payment status</p>
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
          {props.loadingPayments ? "Loading..." : "Refresh transaction"}
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Parents</TableHead>
              <TableHead className="text-xs">Gate</TableHead>
              <TableHead className="text-xs">Transaction code</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Operation</TableHead>
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
                        {isOpen ? "Close" : "Control"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-[var(--admin-sidebar-accent)]">
                        <div className="p-3 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Act</p>
                              <Select value={props.reconcileAction} onValueChange={(v) => props.onReconcileActionChange(v as ReconcileAction)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {reconcileActions.map((a) => <SelectItem key={a} value={a} className="text-xs">{getReconcileActionLabel(a)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Update webhooks</p>
                              <Select value={props.reconcileWebhookResolution} onValueChange={(v) => props.onReconcileWebhookResolutionChange(v as ReconcileWebhookResolution)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE" className="text-xs">No updates</SelectItem>
                                  {reconcileWebhookResolutions.filter((v): v is Exclude<ReconcileWebhookResolution, "NONE"> => v !== "NONE").map((v) => (
                                    <SelectItem key={v} value={v} className="text-xs">{getWebhookResolutionLabel(v)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Select the relevant webhook</p>
                              <Select value={props.reconcileWebhookId} onValueChange={props.onReconcileWebhookIdChange} disabled={props.reconcileWebhookResolution === "NONE"}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-- Select webhook event --" /></SelectTrigger>
                                <SelectContent>
                                  {relatedWebhooks.map((e) => <SelectItem key={e.id} value={e.id} className="text-xs">{e.eventId} ({e.status})</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-[var(--admin-text-secondary)] mb-1">Operating notes</p>
                              <Textarea value={props.reconcileNote} onChange={(e) => props.onReconcileNoteChange(e.target.value)} placeholder="For example, a webhook returns late..." rows={2} className="text-xs" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void props.onSubmitReconcile(payment)} disabled={isReconciling} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                              {isReconciling ? "Checking..." : "Perform reconciliation"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={props.onCloseReconcile} disabled={isReconciling} className="h-7 text-xs">Cancel</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {props.payments.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-[var(--admin-text-secondary)] py-6">No payment record yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
