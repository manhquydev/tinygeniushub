"use client";

export type ApiResponse<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

export type BulkAction = "SUSPEND" | "ACTIVATE" | "SEND_NOTIFICATION";
export type UsersSort = "createdAt_desc" | "createdAt_asc" | "plan_desc" | "plan_asc";
export type UsersStatusFilter =
  | "ALL"
  | "TRIALING"
  | "ACTIVE_STANDARD"
  | "ACTIVE_FAMILYPLUS"
  | "GRACE"
  | "EXPIRED"
  | "CANCELED"
  | "REFUNDED"
  | "NONE";

export type AdminUsersListRow = {
  id: string;
  email: string;
  displayName: string | null;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  childrenCount: number;
  successfulPaymentsCount: number;
  subscription: {
    id: string;
    planCode: string;
    status: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
  } | null;
};

export type AdminUsersListResponse = {
  users?: AdminUsersListRow[];
  total?: number;
  page?: number;
};

export type AdminUserDetail = {
  parent: {
    id: string;
    email: string;
    displayName: string | null;
    suspended: boolean;
    createdAt: string;
    lastActiveAt: string | null;
    notificationCount: number;
  };
  currentSubscription: {
    id: string;
    planCode: string;
    status: string;
    childProfileLimit: number;
    caregiverLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  subscriptionHistory: Array<{
    id: string;
    provider: string;
    providerTransactionId: string;
    amountVnd: number;
    status: string;
    processedAt: string;
    planCode: string | null;
    eventType: string | null;
  }>;
  children: Array<{
    id: string;
    nickname: string;
    createdAt: string;
    lessonsCompleted30d: number;
  }>;
  paymentHistory: Array<{
    id: string;
    provider: string;
    providerTransactionId: string;
    amountVnd: number;
    currency: string;
    status: string;
    processedAt: string;
  }>;
  caregiverInvites: Array<{
    id: string;
    email: string;
    accepted: boolean;
    createdAt: string;
    expiresAt: string;
  }>;
};

export type AdminNote = {
  id: string;
  parentId: string;
  note: string;
  createdAt: string;
  createdBy: string;
};

export const PAGE_SIZE = 20;
