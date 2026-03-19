"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type OrgMember = {
  parentId: string;
  role: string;
  joinedAt: string;
  parent: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

type Props = {
  orgId: string;
  orgName: string;
};

const ROLE_LABELS: Record<string, string> = {
  STUDENT_PARENT: "Phụ huynh học sinh",
  TEACHER_ADMIN: "Giáo viên quản lý",
};

export function AdminOrgMemberPanel({ orgId, orgName }: Props) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentId, setParentId] = useState("");
  const [role, setRole] = useState("STUDENT_PARENT");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`);
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Không thể tải danh sách thành viên");
      }
      const json = await res.json() as { data: { members: OrgMember[] } };
      setMembers(json.data?.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, role }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Thêm thành viên thất bại");
      }
      setParentId("");
      void fetchMembers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Xác nhận xóa thành viên này?")) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: memberId }),
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setMembers((prev) => prev.filter((m) => m.parentId !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi xóa thành viên");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users size={14} className="text-[var(--admin-text-secondary)]" />
        <h3 className="text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wide">
          Thành viên — {orgName}
        </h3>
        <Badge variant="secondary">{members.length}</Badge>
      </div>

      <form onSubmit={(e) => void handleAdd(e)} className="flex flex-wrap gap-2 items-end">
        <div className="grid gap-1">
          <Label className="text-xs">Parent ID</Label>
          <Input
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            placeholder="ID phụ huynh"
            className="h-7 text-xs w-56"
            required
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Vai trò</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-7 text-xs w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT_PARENT">Phụ huynh học sinh</SelectItem>
              <SelectItem value="TEACHER_ADMIN">Giáo viên quản lý</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={adding} size="sm" className="h-7 text-xs gap-1 bg-teal-600 hover:bg-teal-700">
          <UserPlus size={12} />
          {adding ? "Đang thêm..." : "Thêm"}
        </Button>
      </form>

      {addError && <p className="text-xs text-rose-600">{addError}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-xs text-[var(--admin-text-secondary)]">Đang tải...</p>
      ) : (
        <div className="rounded border border-[var(--admin-card-border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Vai trò</TableHead>
                <TableHead className="text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-[var(--admin-text-secondary)] py-4">
                    Chưa có thành viên.
                  </TableCell>
                </TableRow>
              )}
              {members.map((m) => (
                <TableRow key={m.parentId}>
                  <TableCell className="text-xs">
                    <p className="font-medium">{m.parent.email}</p>
                    {m.parent.displayName && (
                      <p className="text-[var(--admin-text-secondary)]">{m.parent.displayName}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700"
                      onClick={() => void handleRemove(m.parentId)}
                      title="Xóa thành viên"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
