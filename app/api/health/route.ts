import { isDemoMode, isGeminiConfigured } from "@/lib/env";
import { apiSuccess, corsPreflight } from "@/lib/api/respond";
import { healthDataSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = healthDataSchema.parse({
    status: "ok",
    demoMode: isDemoMode(),
    geminiConfigured: isGeminiConfigured(),
  });
  return apiSuccess(data);
}


export async function OPTIONS() {
  return corsPreflight();
}
