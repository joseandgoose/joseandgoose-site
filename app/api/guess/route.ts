import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { guess } = await request.json();
    if (typeof guess !== "number" || guess < 0 || guess > 100 || !Number.isInteger(guess)) {
      return NextResponse.json({ error: "Invalid guess" }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("submit_guess", { guess_val: guess });
    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
