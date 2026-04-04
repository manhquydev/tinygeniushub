"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Video, MousePointer } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";

interface ClarityData {
  projectId: string;
  sessions24h: number;
  recordingsAvailable: boolean;
  heatmapsAvailable: boolean;
}

export function ClarityDashboard() {
  const [data, setData] = useState<ClarityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/clarity");
        if (!response.ok) {
          if (response.status === 503) {
            setData(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch");
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading Clarity data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div>Clarity not configured</div>;

  const clarityUrl = `https://clarity.microsoft.com/projects/view/${data.projectId}`;

  return (
    <div className="space-y-4">
      <AdminSectionCard title="Microsoft Clarity Integration" icon={<Video size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Heatmaps</h4>
            <p className="text-sm text-muted-foreground mb-3">
              View click, scroll, and attention heatmaps
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`${clarityUrl}/heatmaps`} target="_blank" rel="noopener noreferrer">
                <MousePointer size={14} className="mr-2" />
                Open Heatmaps
              </a>
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Session Recordings</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Watch user sessions and interactions
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`${clarityUrl}/recordings`} target="_blank" rel="noopener noreferrer">
                <Video size={14} className="mr-2" />
                View Recordings
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" asChild>
            <a href={clarityUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} className="mr-2" />
              Open Clarity Dashboard
            </a>
          </Button>
        </div>
      </AdminSectionCard>
    </div>
  );
}
