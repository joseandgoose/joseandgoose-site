import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Studio's parking-push daemon POSTs live occupancy here every ~30s, authed with
// a shared push key. We stash the latest payload in a single Supabase row; the
// public /parking page reads it back through the password-gated GET /api/parking.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const key = request.headers.get("x-push-key");
  if (!key || key !== process.env.PARKING_PUSH_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { error } = await supabase
    .from("parking_state")
    .upsert({ id: 1, data: payload, updated_at: new Date().toISOString() });

  if (error) {
    console.error("parking ingest upsert error:", error);
    return NextResponse.json({ error: "store failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
