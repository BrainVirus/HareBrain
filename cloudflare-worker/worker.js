/**
 * HareBrain Feedback & Bug Report Cloudflare Worker
 * 
 * 1. Enforces strict CORS and request size limits
 * 2. Verifies Cloudflare Turnstile token via canonical siteverify
 * 3. Sanitizes user input and neutralizes Discord mentions (@everyone / @here)
 * 4. Validates board state links strictly to harebrain.win
 * 5. Dispatches to your private Discord Webhook
 * 
 * Environment Variables / Secrets required:
 * - TURNSTILE_SECRET_KEY: Your private Cloudflare Turnstile secret key
 * - DISCORD_WEBHOOK_URL: Your private Discord channel webhook URL
 */

// In-memory rate limiting map per worker isolate (sliding window: max 5 requests per 60s per IP)
const ipRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const record = ipRateLimits.get(ip) || [];
  const recent = record.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  recent.push(now);
  ipRateLimits.set(ip, recent);
  
  // Cleanup old records to prevent unbounded memory growth
  if (ipRateLimits.size > 1000) {
    for (const [key, timestamps] of ipRateLimits.entries()) {
      if (timestamps.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRateLimits.delete(key);
      }
    }
  }
  return false;
}

// Neutralize Discord role/user pings and mass mentions
function sanitizeDiscordText(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/@everyone/gi, "@\u200beveryone")
    .replace(/@here/gi, "@\u200bhere")
    .replace(/<@&?[0-9]+>/g, "[mention]");
}

export default {
  async fetch(request, env) {
    // 1. Configure CORS
    const allowedOrigins = [
      "https://harebrain.win",
      "https://www.harebrain.win"
    ];

    const origin = request.headers.get("Origin") || "";
    const isAllowed = allowedOrigins.includes(origin);

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

    // 2. Enforce request size limit (max 15KB)
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 15360) {
      return new Response(JSON.stringify({ error: "Request payload too large." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Client IP and Rate Limit Check
    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ 
        error: "Too many feedback submissions. Please wait a minute before trying again." 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      });
    }

    try {
      const data = await request.json();
      const { type, message, contact, boardUrl, turnstileToken } = data;

      // 4. Validate input fields
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Message is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (message.length > 2000) {
        return new Response(JSON.stringify({ error: "Message exceeds maximum allowed length." }), {
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

      // 5. Resolve Secrets (supports both ES Module env and Service Worker globals)
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

      // 6. Canonical Server-side Siteverify
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
        console.error("Turnstile verification failed:", verifyData["error-codes"] || []);
        return new Response(JSON.stringify({
          error: "Verification check failed. Please refresh and try again."
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 7. Validate and sanitize Category
      const allowedCategories = ["Bug Report", "Feature Request", "Math / Rule Clarification", "General Feedback"];
      const cleanType = allowedCategories.includes(type) ? type : "General Feedback";

      let embedColor = 0x3498db; // Blue (General)
      if (cleanType === "Bug Report") embedColor = 0xe74c3c; // Red
      else if (cleanType === "Feature Request") embedColor = 0xf1c40f; // Gold
      else if (cleanType === "Math / Rule Clarification") embedColor = 0x9b59b6; // Purple

      const cleanContact = contact && typeof contact === "string" 
        ? sanitizeDiscordText(contact.trim().slice(0, 150)) 
        : "Anonymous";

      const cleanMessage = sanitizeDiscordText(message.trim().slice(0, 1024));

      const fields = [
        { name: "📋 Category", value: cleanType, inline: true },
        { name: "👤 Contact", value: cleanContact || "Anonymous", inline: true }
      ];

      // 8. Validate Board State URL strictly to harebrain.win domain
      if (boardUrl && typeof boardUrl === "string") {
        try {
          const parsedUrl = new URL(boardUrl);
          if (parsedUrl.protocol === "https:" && (parsedUrl.hostname === "harebrain.win" || parsedUrl.hostname === "www.harebrain.win")) {
            fields.push({
              name: "🐇 Board State Link",
              value: `[View Board State in HareBrain](${parsedUrl.href.slice(0, 500)})`,
              inline: false
            });
          }
        } catch {
          // Ignore invalid URLs
        }
      }

      fields.push({
        name: "💬 Message",
        value: cleanMessage,
        inline: false
      });

      const discordPayload = {
        username: "HareBrain Feedback",
        avatar_url: "https://harebrain.win/favicon.ico",
        embeds: [{
          title: `🐇 New ${cleanType} Received!`,
          color: embedColor,
          fields: fields,
          footer: { text: "HareBrain MTG Calculator • harebrain.win" },
          timestamp: new Date().toISOString()
        }]
      };

      // 9. Dispatch to Discord Webhook
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
