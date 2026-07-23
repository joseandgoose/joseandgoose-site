import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Password-gated read for the public /parking page. The passphrase travels in a
// header (never the URL) and is checked against PARKING_PASSWORD server-side, so
// the occupancy data is only served to someone who knows the word.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const pw = request.headers.get("x-parking-pw");
  if (!pw || pw !== process.env.PARKING_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("parking_state")
    .select("data, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("parking read error:", error);
    return NextResponse.json({ error: "read failed" }, { status: 500 });
  }
  if (!data) {
    // table exists but no push has landed yet
    return NextResponse.json({ pending: true, spots: [], open: 0, total: 0 });
  }

  const payload = (data.data ?? {}) as Record<string, unknown>;
  return NextResponse.json({ ...payload, stored_at: data.updated_at });
}
