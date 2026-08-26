import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function currentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86_400_000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "user_id query param required." } },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  const week = currentWeek();

  const { data } = await supabase
    .from("usage_limits")
    .select("count, limit")
    .eq("user_id", userId)
    .eq("week", week)
    .eq("service_key", "ROSE")
    .single();

  const limit = 200;
  const count = data?.count ?? 0;
  const rowLimit = data?.limit ?? limit;

  return NextResponse.json({
    user_id: userId,
    week,
    count,
    limit: rowLimit,
    allowed: count < rowLimit,
    remaining: Math.max(0, rowLimit - count),
  });
}
