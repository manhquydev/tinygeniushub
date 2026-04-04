"use client";

import { useEffect, useState } from "react";
import { Activity, Users, Clock } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";

interface RealtimeData {
  activeUsers: number;
  activeSessions: number;
  timestamp: string;
}

export function RealtimeDashboard() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/realtime");
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setError(null);
        } else {
          setError("Failed to fetch data");
        }
      } catch {
        setError("Network error");
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AdminStatCard
        label="Active Users"
        value={data.activeUsers}
        icon={<Users size={16} />}
      />
      <AdminStatCard
        label="Active Sessions"
        value={data.activeSessions}
        icon={<Activity size={16} />}
      />
      <AdminStatCard
        label="Last Updated"
        value={new Date(data.timestamp).toLocaleTimeString()}
        icon={<Clock size={16} />}
      />
    </div>
  );
}
