import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.rpc("get_game_state");
    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json({ error: "Failed to get state" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
