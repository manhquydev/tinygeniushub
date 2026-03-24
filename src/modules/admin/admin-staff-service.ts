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
    "Không tải được danh sách nhân sự. Kiểm tra quyền SUPER_ADMIN.",
  );

  return requireUsers(data, "Không tải được danh sách nhân sự. Kiểm tra quyền SUPER_ADMIN.");
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
    "Có lỗi xảy ra khi tạo tài khoản.",
  );

  return requireUser(data, "Có lỗi xảy ra khi tạo tài khoản.");
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
    "Có lỗi xảy ra khi cập nhật.",
  );

  return requireUser(data, "Có lỗi xảy ra khi cập nhật.");
}
