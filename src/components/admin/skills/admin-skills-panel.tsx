"use client";

import { useState, useCallback } from "react";
import { Sparkles, Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSkillCreateForm } from "./admin-skill-create-form";

type SkillNode = {
  id: string;
  code: string;
  domain: string;
  nameVi: string;
  nameEn: string | null;
  gradeLevel: number;
  orderNo: number;
  parentId: string | null;
  iconEmoji: string | null;
  children?: SkillNode[];
};

type FlatSkill = Omit<SkillNode, "children"> & { depth: number };

function flattenTree(nodes: SkillNode[], depth = 0): FlatSkill[] {
  const result: FlatSkill[] = [];
  for (const node of nodes) {
    const { children, ...rest } = node;
    result.push({ ...rest, depth });
    if (children?.length) {
      result.push(...flattenTree(children, depth + 1));
    }
  }
  return result;
}

const DOMAIN_LABELS: Record<string, string> = {
  MATH: "Toán học",
  ENGLISH_PHONICS: "Phonics Tiếng Anh",
};

async function fetchSkillTree(): Promise<SkillNode[]> {
  const res = await fetch("/api/admin/skills");
  if (!res.ok) return [];
  const json = await res.json() as { data?: { skills: SkillNode[] } };
  return json.data?.skills ?? [];
}

export function AdminSkillsPanel({ initialSkills }: { initialSkills: SkillNode[] }) {
  const [skills, setSkills] = useState<SkillNode[]>(initialSkills);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const flat = flattenTree(skills);

  const refreshSkills = useCallback(async () => {
    const updated = await fetchSkillTree();
    setSkills(updated);
  }, []);

  async function handleCreated() {
    setShowForm(false);
    await refreshSkills();
  }

  async function handleDelete(skillId: string) {
    if (!confirm("Xác nhận xóa skill này? Thao tác không thể hoàn tác.")) return;
    setDeletingId(skillId);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, { method: "DELETE" });
      if (!res.ok) {
        let message = `Xóa thất bại (${res.status})`;
        try {
          const body = await res.json() as { error?: string; message?: string };
          if (body.error) message = body.error;
          else if (body.message) message = body.message;
        } catch {
          // ignore JSON parse failure — use default message
        }
        setDeleteError(message);
        return;
      }
      await refreshSkills();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--admin-text-secondary)]" />
          <h1 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Skills</h1>
          <Badge variant="secondary">{flat.length}</Badge>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1 bg-teal-600 hover:bg-teal-700" onClick={() => setShowForm(true)}>
          <Plus size={13} />
          Thêm skill
        </Button>
      </div>

      {showForm && (
        <AdminSkillCreateForm
          onCreated={() => void handleCreated()}
          onCancel={() => setShowForm(false)}
        />
      )}

      {deleteError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400">
          {deleteError}
        </div>
      )}

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Skill</TableHead>
              <TableHead className="text-xs">Domain</TableHead>
              <TableHead className="text-xs">Lớp</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flat.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-[var(--admin-text-secondary)] py-8">
                  Chưa có skill nào.
                </TableCell>
              </TableRow>
            )}
            {flat.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1" style={{ paddingLeft: `${skill.depth * 16}px` }}>
                    {skill.depth > 0 && <ChevronRight size={10} className="text-[var(--admin-text-muted)] shrink-0" />}
                    {skill.iconEmoji && <span>{skill.iconEmoji}</span>}
                    <span className="font-medium text-[var(--admin-text-primary)]">{skill.nameVi}</span>
                    {skill.nameEn && <span className="text-[var(--admin-text-secondary)]">({skill.nameEn})</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{DOMAIN_LABELS[skill.domain] ?? skill.domain}</Badge>
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">Lớp {skill.gradeLevel}</TableCell>
                <TableCell><code className="text-xs font-mono text-[var(--admin-text-secondary)]">{skill.code}</code></TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700"
                    onClick={() => void handleDelete(skill.id)}
                    disabled={deletingId === skill.id}
                    title="Xóa skill"
                  >
                    <Trash2 size={12} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
