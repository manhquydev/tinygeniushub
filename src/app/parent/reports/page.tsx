import { ReportsPanel } from "@/components/reports-panel";
import { requireParent } from "@/lib/auth/require-parent";
import { getLatestWeeklyReports } from "@/modules/reports/weekly-report-service";

export default async function ParentReportsPage() {
  const parent = await requireParent();
  const reports = await getLatestWeeklyReports(parent.id);

  return (
    <div className="page-stack">
      <ReportsPanel initialReports={reports} />
    </div>
  );
}
