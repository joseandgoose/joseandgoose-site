import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

async function embed(text: string): Promise<number[]> {
  const res = await fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    throw new Error(`HF API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length > 200) {
    return NextResponse.json({ results: [] });
  }

  try {
    const embedding = await embed(query);

    const { data, error } = await supabase.rpc("search_content", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.2,
      match_count: 6,
    });

    if (error) {
      console.error("Vector search error:", error);
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    return NextResponse.json({ results: data });
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
