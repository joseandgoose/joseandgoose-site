import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, address, fruit_type, bid_amount, note } = body;

    if (!lat || !lng || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if address is in a blocklisted listing
    const { data: blocked } = await supabase
      .from("fruit_listings")
      .select("id")
      .eq("address", address)
      .eq("status", "blocklisted")
      .limit(1);

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ error: "This address has been blocklisted" }, { status: 403 });
    }

    // Check if a request already exists for this address
    const { data: existing } = await supabase
      .from("fruit_requests")
      .select("id, request_count")
      .eq("address", address)
      .eq("status", "open")
      .limit(1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("fruit_requests")
        .update({ request_count: existing.request_count + 1 })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
      }
      return NextResponse.json({ success: true, id: existing.id, incremented: true });
    }

    const { data, error } = await supabase
      .from("fruit_requests")
      .insert({ lat, lng, address, fruit_type, bid_amount: bid_amount ?? null, note: note ?? null })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
