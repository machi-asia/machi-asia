import { NextResponse } from "next/server";
import { scanMonorepo } from "@/lib/scanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = scanMonorepo(false);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scan packages", details: String(error) },
      { status: 500 }
    );
  }
}
