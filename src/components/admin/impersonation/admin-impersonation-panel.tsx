"use client";

import { useState } from "react";
import { Search, ShieldUser, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type UserResult = {
  id: string;
  email: string;
  displayName: string | null;
  suspended: boolean;
};

type SearchResponse = {
  data?: {
    users?: UserResult[];
    total?: number;
  };
};

export function AdminImpersonationPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<UserResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json() as SearchResponse;
      const users = json.data?.users ?? [];
      setResults(users);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSearching(false);
    }
  }

  async function handleImpersonate(user: UserResult) {
    setConfirming(null);
    setImpersonatingId(user.id);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: user.id }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Unable to log in instead");
      }
      const json = await res.json() as { data?: { redirectTo?: string } };
      if (json.data?.redirectTo) {
        window.location.href = json.data.redirectTo;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error");
      setImpersonatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[var(--admin-text-secondary)]" />
          <h2 className="text-sm font-semibold text-[var(--admin-text-secondary)]">Find users</h2>
        </div>
        <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
          <div className="flex-1 grid gap-1">
            <Label htmlFor="search-query" className="text-xs">Email or name</Label>
            <Input
              id="search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="example@email.com"
              className="h-8 text-sm"
            />
          </div>
          <Button type="submit" disabled={searching} className="self-end h-8 text-xs bg-teal-600 hover:bg-teal-700">
            {searching ? "Looking for..." : "Find"}
          </Button>
        </form>
        {searchError && <p className="text-xs text-rose-600">{searchError}</p>}
        {actionError && <p className="text-xs text-rose-600">{actionError}</p>}
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] divide-y divide-[var(--admin-card-border)]">
          {results.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-medium text-[var(--admin-text-primary)]">{user.email}</p>
                {user.displayName && (
                  <p className="text-xs text-[var(--admin-text-secondary)]">{user.displayName}</p>
                )}
                <p className="text-xs text-[var(--admin-text-muted)] font-mono">{user.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={!user.suspended ? "text-emerald-600 border-emerald-200" : "text-rose-600 border-rose-200"}>
                  {!user.suspended ? "Work" : "Locked"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setConfirming(user)}
                  disabled={impersonatingId === user.id}
                >
                  <ShieldUser size={12} />
                  Log in instead
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && query && !searchError && (
        <p className="text-xs text-[var(--admin-text-secondary)] text-center py-4">
          No users found.
        </p>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-6 shadow-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2">
              <LogIn size={18} className="text-amber-500" />
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Confirm login instead</h3>
            </div>
            <p className="text-sm text-[var(--admin-text-secondary)]">
              You will log in to the system as {" "}
              <strong>{confirming.email}</strong>. This action is logged.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={impersonatingId === confirming.id}
                onClick={() => void handleImpersonate(confirming)}
              >
                {impersonatingId === confirming.id ? "Moving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
