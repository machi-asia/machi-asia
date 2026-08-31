import { NextRequest, NextResponse } from "next/server";
import { getComponentById } from "@/lib/scanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing component id parameter" }, { status: 400 });
  }

  try {
    const component = getComponentById(id);
    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    return NextResponse.json(component, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load component details", details: String(error) },
      { status: 500 }
    );
  }
}
