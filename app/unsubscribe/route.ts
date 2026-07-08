import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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
    .badge { display: inline-block; background: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; margin-bottom: 16px; }
    form { display: flex; flex-direction: column; gap: 10px; }
    input[type=email] { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 14px; outline: none; }
    input[type=email]:focus { border-color: #dc2626; }
    button { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; }
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

  // No email — show form
  if (!email) {
    return html(
      "Unsubscribe — Market Brief",
      `<div class="badge">Unsubscribe</div>
       <h1>Unsubscribe from Market Brief</h1>
       <p>Enter your email address and we'll remove you from the list.</p>
       <form method="GET">
         <input type="email" name="email" placeholder="your@email.com" required autofocus />
         <button type="submit">Unsubscribe</button>
       </form>
       <p style="margin-top:16px;font-size:12px"><a href="https://joseandgoose.com">← joseandgoose.com</a></p>`
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return html(
      "Invalid email — Market Brief",
      `<h1>Invalid email</h1><p>That doesn't look like a valid email address. <a href="/unsubscribe">Try again.</a></p>`
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("market_subscribers")
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq("email", email);

  if (error) {
    console.error("market-unsubscribe error:", error);
    return html(
      "Error — Market Brief",
      `<h1>Something went wrong</h1><p>Couldn't process your request. Try again or <a href="mailto:jose@joseandgoose.com">reach out directly</a>.</p>`
    );
  }

  return html(
    "Unsubscribed — Market Brief",
    `<div class="badge">Unsubscribed</div>
     <h1>You're unsubscribed</h1>
     <p>${email} has been removed from the market brief.</p>
     <p>Changed your mind? <a href="/subscribe?email=${encodeURIComponent(email)}">Resubscribe here.</a></p>
     <p><a href="https://joseandgoose.com">← joseandgoose.com</a></p>`
  );
}
