import { requireUser } from "@/lib/auth/actions";
import { getAppData } from "@/lib/services/data";
import { SyllabusManager } from "@/components/app/syllabus-manager";

export const dynamic = "force-dynamic";

export default async function SyllabusPage() {
  const user = await requireUser();
  const data = await getAppData(user.id);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Syllabus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your curriculum, mapped topic by topic. Mark progress as you go — the planner and Pilot react instantly.
        </p>
      </div>
      <SyllabusManager subjects={data.subjects} />
    </div>
  );
}