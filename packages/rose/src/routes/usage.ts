import { NextRequest, NextResponse } from "next/server";
import { getRoseUsage, currentWeek, currentDay } from "../lib/usage";
import {
  gatewayUnauthorized,
  parseRoles,
  requireUserId,
} from "../lib/gateway-identity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const roles = parseRoles(req);

  if (roles.includes("admin")) {
    return NextResponse.json({
      user_id: userId,
      week: currentWeek(),
      day: currentDay(),
      count: 0,
      limit: null,
      dailyCount: 0,
      dailyLimit: null,
      allowed: true,
      remaining: null,
      role: "admin",
    });
  }

  const usage = await getRoseUsage(userId, roles);

  return NextResponse.json({
    user_id: userId,
    week: usage.week,
    day: usage.day,
    count: usage.count,
    limit: usage.limit,
    dailyCount: usage.dailyCount,
    dailyLimit: usage.dailyLimit,
    allowed: usage.allowed,
    exceededType: usage.exceededType,
    remaining: usage.remaining,
    role: usage.role,
  });
}