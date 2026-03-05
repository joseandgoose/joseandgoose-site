import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [listingsRes, exchangesRes] = await Promise.all([
      supabase.from("fruit_listings").select("fruit_type, exchange_count").eq("status", "active"),
      supabase.from("fruit_exchanges").select("id", { count: "exact", head: true }),
    ]);

    const listings = listingsRes.data ?? [];
    const totalExchanges = exchangesRes.count ?? 0;

    const fruitCounts: Record<string, number> = {};
    for (const l of listings) {
      fruitCounts[l.fruit_type] = (fruitCounts[l.fruit_type] ?? 0) + 1;
    }
    const topTrees = Object.entries(fruitCounts)
      .map(([fruit_type, count]) => ({ fruit_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const requestsRes = await supabase
      .from("fruit_requests")
      .select("address, fruit_type, request_count")
      .eq("status", "open")
      .order("request_count", { ascending: false })
      .limit(5);

    return NextResponse.json({
      total_trees: listings.length,
      total_exchanges: totalExchanges,
      top_trees: topTrees,
      top_requested: requestsRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
