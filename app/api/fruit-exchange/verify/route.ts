import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const { data: verification, error } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !verification) {
      return NextResponse.redirect(new URL("/fruit-exchange?error=invalid_token", request.url));
    }
    if (verification.used_at) {
      return NextResponse.redirect(new URL("/fruit-exchange?error=token_used", request.url));
    }
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.redirect(new URL("/fruit-exchange?error=token_expired", request.url));
    }

    const listingData = verification.listing_data as {
      lat: number; lng: number; address: string; fruit_type: string;
      owner_name: string; owner_email: string; venmo_handle?: string; rules?: string;
    };

    const { error: insertError } = await supabase.from("fruit_listings").insert({
      lat: listingData.lat,
      lng: listingData.lng,
      address: listingData.address,
      fruit_type: listingData.fruit_type,
      owner_name: listingData.owner_name,
      owner_email: listingData.owner_email,
      venmo_handle: listingData.venmo_handle ?? null,
      rules: listingData.rules ?? null,
      status: "active",
    });

    if (insertError) {
      console.error("Failed to create listing:", insertError);
      return NextResponse.redirect(new URL("/fruit-exchange?error=server_error", request.url));
    }

    await supabase
      .from("email_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("id", verification.id);

    return NextResponse.redirect(new URL("/fruit-exchange?verified=true", request.url));
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.redirect(new URL("/fruit-exchange?error=server_error", request.url));
  }
}
