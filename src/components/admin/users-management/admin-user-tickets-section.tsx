"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AdminUserEntitlement, AdminUserTicketAction } from "./admin-users-management-types";
import { formatDate, getTicketBadgeClass } from "./admin-users-management-utils";

type AdminUserTicketsSectionProps = {
  entitlements: AdminUserEntitlement[];
  ticketActionLoading: boolean;
  ticketActionFeedback: string | null;
  grantOfferingCode: string;
  extendDays: string;
  onGrantOfferingCodeChange: (next: string) => void;
  onExtendDaysChange: (next: string) => void;
  onTicketAction: (action: AdminUserTicketAction, offeringCode: string) => Promise<void>;
};

export function AdminUserTicketsSection(props: AdminUserTicketsSectionProps) {
  return (
    <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
        Household tickets
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={props.grantOfferingCode}
          onChange={(event) => props.onGrantOfferingCodeChange(event.target.value)}
          placeholder="offering code"
          className="w-36 h-8 text-xs"
        />
        <Input
          type="number"
          min={1}
          max={3650}
          value={props.extendDays}
          onChange={(event) => props.onExtendDaysChange(event.target.value)}
          aria-label="Days"
          className="w-20 h-8 text-xs"
        />
        <span className="text-xs text-[var(--admin-text-secondary)]">days</span>
        <Button
          size="sm"
          onClick={() => void props.onTicketAction("grant", props.grantOfferingCode)}
          disabled={props.ticketActionLoading}
          className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
        >
          Grant
        </Button>
      </div>
      {props.entitlements.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">No tickets yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Catalog</TableHead>
                <TableHead className="text-xs">Kind</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">Until</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.entitlements.map((ticket, index) => {
                const live = ticket.status === "ACTIVE" || ticket.status === "GRACE";
                return (
                  <TableRow key={`${ticket.offeringCode}-${ticket.status}-${index}`}>
                    <TableCell className="text-xs font-medium">{ticket.offeringCode}</TableCell>
                    <TableCell className="text-xs">{ticket.catalogKey}</TableCell>
                    <TableCell className="text-xs">{ticket.kind}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", getTicketBadgeClass(ticket.status))}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(ticket.validFrom)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(ticket.validUntil)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          onClick={() => void props.onTicketAction("extend", ticket.offeringCode)}
                          disabled={props.ticketActionLoading || !live}
                          className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Extend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void props.onTicketAction("expire", ticket.offeringCode)}
                          disabled={props.ticketActionLoading || !live}
                          className="h-7 text-xs border-amber-300 text-amber-800"
                        >
                          Expire
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {props.ticketActionFeedback ? (
        <p className="text-xs text-[var(--admin-text-secondary)]">{props.ticketActionFeedback}</p>
      ) : null}
    </div>
  );
}
