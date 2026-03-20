import { createAuthClient } from "better-auth/react";

export const adminAuthClient = createAuthClient({
    baseURL: "/api/admin/auth",
});
