import { requireUser } from "@/lib/auth/actions";
import { getAppData } from "@/lib/services/data";
import { ExamManager } from "@/components/app/exam-manager";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const user = await requireUser();
  const data = await getAppData(user.id);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Am I ready? Readiness blends syllabus coverage with whether the remaining work fits your available time.
        </p>
      </div>
      <ExamManager
        exams={data.exams}
        subjects={data.subjects.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}