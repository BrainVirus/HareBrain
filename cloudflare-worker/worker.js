/**
 * HareBrain Feedback & Bug Report Cloudflare Worker
 * 
 * 1. Verifies Cloudflare Turnstile token via canonical siteverify
 * 2. Formats a rich Discord embed with category, message, contact, and board state
 * 3. Dispatches to your private Discord Webhook
 * 
 * Environment Variables / Secrets required:
 * - TURNSTILE_SECRET_KEY: Your private Cloudflare Turnstile secret key
 * - DISCORD_WEBHOOK_URL: Your private Discord channel webhook URL
 */

export default {
  async fetch(request, env) {
    // 1. Configure CORS
    const allowedOrigins = [
      "https://harebrain.win",
      "http://localhost",
      "http://127.0.0.1"
    ];

    const origin = request.headers.get("Origin") || "";
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowed ? origin : "https://harebrain.win",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const data = await request.json();
      const { type, message, contact, boardUrl, turnstileToken } = data;

      // 2. Validate input fields
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Message is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!turnstileToken || typeof turnstileToken !== "string" || turnstileToken.length > 2048) {
        return new Response(JSON.stringify({ error: "Turnstile verification token is missing or invalid." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Resolve Secrets (supports both ES Module env and Service Worker globals)
      const turnstileSecret = (typeof env !== 'undefined' && env?.TURNSTILE_SECRET_KEY)
        || (typeof TURNSTILE_SECRET_KEY !== 'undefined' ? TURNSTILE_SECRET_KEY : null)
        || (typeof globalThis !== 'undefined' && globalThis?.TURNSTILE_SECRET_KEY);

      const discordWebhook = (typeof env !== 'undefined' && env?.DISCORD_WEBHOOK_URL)
        || (typeof DISCORD_WEBHOOK_URL !== 'undefined' ? DISCORD_WEBHOOK_URL : null)
        || (typeof globalThis !== 'undefined' && globalThis?.DISCORD_WEBHOOK_URL);

      if (!turnstileSecret || !discordWebhook) {
        console.error("Server configuration missing required secrets (TURNSTILE_SECRET_KEY or DISCORD_WEBHOOK_URL)");
        return new Response(JSON.stringify({ 
          error: "Server configuration error. Please try again later." 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 4. Canonical Server-side Siteverify
      const clientIp = request.headers.get("CF-Connecting-IP") || "";
      const siteverifyParams = new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken,
        remoteip: clientIp
      });

      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: siteverifyParams
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        return new Response(JSON.stringify({
          error: "Turnstile verification failed.",
          codes: verifyData["error-codes"] || []
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 5. Build Discord Embed
      let embedColor = 0x3498db; // Blue (General)
      if (type === "Bug Report") embedColor = 0xe74c3c; // Red
      else if (type === "Feature Request") embedColor = 0xf1c40f; // Gold
      else if (type === "Math / Rule Clarification") embedColor = 0x9b59b6; // Purple

      const fields = [
        { name: "📋 Category", value: type || "General Feedback", inline: true },
        { name: "👤 Contact", value: contact ? contact.slice(0, 150) : "Anonymous", inline: true }
      ];

      if (boardUrl && typeof boardUrl === "string" && boardUrl.startsWith("http")) {
        fields.push({
          name: "🐇 Board State Link",
          value: `[View Board State in HareBrain](${boardUrl.slice(0, 500)})`,
          inline: false
        });
      }

      fields.push({
        name: "💬 Message",
        value: message.slice(0, 1024),
        inline: false
      });

      const discordPayload = {
        username: "HareBrain Feedback",
        avatar_url: "https://harebrain.win/favicon.ico",
        embeds: [{
          title: `🐇 New ${type || "Feedback"} Received!`,
          color: embedColor,
          fields: fields,
          footer: { text: "HareBrain MTG Calculator • harebrain.win" },
          timestamp: new Date().toISOString()
        }]
      };

      // 6. Dispatch to Discord Webhook
      const discordRes = await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });

      if (!discordRes.ok) {
        const errorText = await discordRes.text();
        throw new Error(`Discord Webhook error (${discordRes.status}): ${errorText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Feedback Worker Error:", err);
      return new Response(JSON.stringify({ error: "Failed to send feedback. Please try again later." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
