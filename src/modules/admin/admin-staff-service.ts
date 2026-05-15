import type { AdminRole } from "@prisma/client";

export type { AdminRole };

type ApiEnvelope<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type CreateAdminStaffInput = {
  email: string;
  password: string;
  displayName: string;
  role: AdminRole;
};

export type UpdateAdminStaffInput = {
  id: string;
  displayName?: string;
  role?: AdminRole;
  isActive?: boolean;
};

async function parseApiResponse<TData>(response: Response, fallbackMessage: string): Promise<TData> {
  let body: ApiEnvelope<TData>;

  try {
    body = (await response.json()) as ApiEnvelope<TData>;
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok || !body.ok || body.data === undefined) {
    throw new Error(body.error?.message ?? fallbackMessage);
  }

  return body.data;
}

function requireUsers(data: { users?: AdminUserRow[] }, fallbackMessage: string) {
  if (!Array.isArray(data.users)) {
    throw new Error(fallbackMessage);
  }

  return data.users;
}

function requireUser(data: { user?: AdminUserRow }, fallbackMessage: string) {
  if (!data.user) {
    throw new Error(fallbackMessage);
  }

  return data.user;
}

export async function listAdminStaff() {
  const response = await fetch("/api/admin/staff", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  const data = await parseApiResponse<{ users?: AdminUserRow[] }>(
    response,
    "Unable to download personnel list. Check SUPER_ADMIN permissions.",
  );

  return requireUsers(data, "Unable to download personnel list. Check SUPER_ADMIN permissions.");
}

export async function createAdminStaff(input: CreateAdminStaffInput) {
  const response = await fetch("/api/admin/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ user?: AdminUserRow }>(
    response,
    "An error occurred while creating the account.",
  );

  return requireUser(data, "An error occurred while creating the account.");
}

export async function updateAdminStaff(input: UpdateAdminStaffInput) {
  const response = await fetch(`/api/admin/staff/${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      displayName: input.displayName,
      role: input.role,
      isActive: input.isActive,
    }),
  });

  const data = await parseApiResponse<{ user?: AdminUserRow }>(
    response,
    "An error occurred while updating.",
  );

  return requireUser(data, "An error occurred while updating.");
}
