import { requireUser } from "@/lib/auth/actions";
import { getProfileBundle } from "@/lib/services/data";
import { SettingsManager } from "@/components/app/settings-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfileBundle(user.id);
  if (!profile) return null;

  const provider = process.env.AI_PROVIDER || (process.env.AI_API_KEY ? "openai" : "");
  const aiStatus = {
    provider: provider || "openai",
    configured: Boolean(process.env.AI_API_KEY),
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile, planning preferences and AI configuration.</p>
      </div>
      <SettingsManager profile={profile} aiStatus={aiStatus} />
    </div>
  );
}