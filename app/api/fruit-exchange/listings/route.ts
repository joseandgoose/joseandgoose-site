import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { randomUUID } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const FRUIT_TYPES = ["apple", "lemon", "lime", "orange", "grapefruit", "fig", "avocado", "persimmon", "stone_fruit", "other"];

export async function GET() {
  try {
    const [listingsRes, requestsRes] = await Promise.all([
      supabase.from("fruit_listings").select("id,lat,lng,address,fruit_type,owner_name,venmo_handle,rules,status,exchange_count"),
      supabase.from("fruit_requests").select("id,lat,lng,address,fruit_type,bid_amount,request_count,status"),
    ]);
    return NextResponse.json({
      listings: listingsRes.data ?? [],
      requests: requestsRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, address, fruit_type, owner_name, owner_email, venmo_handle, rules } = body;

    if (!lat || !lng || !address || !fruit_type || !owner_name || !owner_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!FRUIT_TYPES.includes(fruit_type)) {
      return NextResponse.json({ error: "Invalid fruit type" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("email_verifications").insert({
      email: owner_email,
      token,
      listing_data: { lat, lng, address, fruit_type, owner_name, owner_email, venmo_handle, rules },
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create verification" }, { status: 500 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://joseandgoose.com"}/api/fruit-exchange/verify?token=${token}`;

    await resend.emails.send({
      from: "Fruit Exchange <noreply@joseandgoose.com>",
      to: owner_email,
      subject: "Verify your fruit tree listing 🌳",
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #3D2009;">🌳 Fruit Exchange Listing Verification</h2>
          <p>Hi ${owner_name},</p>
          <p>Click the button below to verify your <strong>${fruit_type}</strong> tree at <strong>${address}</strong>.</p>
          <p>This link expires in 24 hours.</p>
          <p style="margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #5A8A3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ✓ Verify My Listing
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">Or paste this URL: ${verifyUrl}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
