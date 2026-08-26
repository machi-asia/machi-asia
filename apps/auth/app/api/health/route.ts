import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json({
    status: "ok",
    service: "machi-asia-auth",
    timestamp: new Date().toISOString(),
  });
}
