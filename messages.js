// Netlify serverless function — proxies requests to Anthropic API
// Your ANTHROPIC_API_KEY lives here, never in the browser

export default async (req, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: corsHeaders,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ type: "error", error: { message: "ANTHROPIC_API_KEY not set in Netlify environment variables" } }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await req.text();

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body,
    });

    const data = await upstream.text();

    return new Response(data, {
      status: upstream.status,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ type: "error", error: { message: err.message } }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const config = { path: "/api/messages" };
