import { apiError } from "@/lib/api/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated history is a later Supabase milestone.
 * Guests always receive UNAUTHORIZED.
 */
export async function GET() {
  return apiError("UNAUTHORIZED");
}
