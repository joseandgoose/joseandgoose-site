import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listing_id, note, rating } = body;

    if (!listing_id) {
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
    }
    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const { error: insertError } = await supabase.from("fruit_exchanges").insert({
      listing_id,
      note: note ?? null,
      rating: rating ?? null,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to record exchange" }, { status: 500 });
    }

    // Increment exchange_count on listing
    const { data: listing } = await supabase
      .from("fruit_listings")
      .select("exchange_count")
      .eq("id", listing_id)
      .single();

    if (listing) {
      await supabase
        .from("fruit_listings")
        .update({ exchange_count: (listing.exchange_count ?? 0) + 1 })
        .eq("id", listing_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
