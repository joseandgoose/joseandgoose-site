import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function html(title: string, body: string) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 14px; padding: 40px 36px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .logo { font-size: 28px; margin-bottom: 20px; }
    h1 { color: #111827; font-size: 20px; margin: 0 0 12px; }
    p { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
    a { color: #264635; text-decoration: none; font-weight: 600; }
    .badge { display: inline-block; background: #f0fdf4; color: #15803d; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; margin-bottom: 16px; }
    form { display: flex; flex-direction: column; gap: 10px; }
    input[type=email] { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 14px; outline: none; }
    input[type=email]:focus { border-color: #264635; }
    button { background: #264635; color: #fff; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📈</div>
    ${body}
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return html(
      "Subscribe — Market Brief",
      `<div class="badge">Market Brief</div>
       <h1>Get the daily brief</h1>
       <p>Weekday morning market snapshot, news, and options flow — direct to your inbox.</p>
       <form method="GET">
         <input type="email" name="email" placeholder="your@email.com" required autofocus />
         <button type="submit">Subscribe</button>
       </form>
       <p style="margin-top:16px;font-size:12px">By subscribing you agree to receive weekday emails.<br>You can unsubscribe at any time.</p>`
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return html(
      "Invalid email — Market Brief",
      `<h1>Invalid email</h1><p>That doesn't look like a valid email address. <a href="/subscribe">Try again.</a></p>`
    );
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("market_subscribers")
    .upsert(
      { email, subscribed: true, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: "email" }
    );

  if (error) {
    console.error("market-subscribe error:", error);
    return html(
      "Error — Market Brief",
      `<h1>Something went wrong</h1><p>Couldn't save your subscription. Try again or <a href="mailto:jose@joseandgoose.com">reach out directly</a>.</p>`
    );
  }

  return html(
    "Subscribed — Market Brief",
    `<div class="badge">Confirmed</div>
     <h1>You're on the list</h1>
     <p>You'll receive the daily market brief on weekday mornings. Check your inbox tomorrow.</p>
     <p><a href="https://joseandgoose.com">← joseandgoose.com</a></p>`
  );
}
