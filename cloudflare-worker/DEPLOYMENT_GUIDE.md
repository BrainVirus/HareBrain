# 🚀 Deploying the HareBrain Feedback Worker (Cloudflare + Discord)

This guide walks you through setting up the free Cloudflare Worker to receive feedback and bug reports from `harebrain.win`, verify them with Cloudflare Turnstile, and post them directly to your Discord channel.

---

### Step 1: Create Your Discord Webhook (Takes 30 seconds)

1. Open Discord and go to your server (e.g. your private server).
2. Create or pick a channel (e.g., `#harebrain-feedback`).
3. Click the gear icon next to the channel name (or right-click ➔ **Edit Channel**).
4. Go to **Integrations** ➔ **Webhooks** ➔ **New Webhook**.
5. Give it a name (e.g. `HareBrain Feedback Bot`).
6. Click **Copy Webhook URL** and keep it handy.

---

### Step 2: Create the Worker in Cloudflare Dashboard (Takes 60 seconds)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left menu, click **Compute (Workers) ➔ Workers & Pages** (or **Workers & Pages**).
3. Click **Create Application** ➔ **Create Worker**.
4. Name your Worker: `harebrain-feedback` (or any name you prefer).
5. Click **Deploy**.
6. On the deployment confirmation page, click **Edit code**.
7. Delete everything in the code editor, and copy & paste the contents of `cloudflare-worker/worker.js` from this project into the editor.
8. Click **Deploy** (top right).

---

### Step 3: Add Your Secrets in Cloudflare

1. Inside your `harebrain-feedback` Worker page in Cloudflare, go to the **Settings** tab.
2. Under **Variables and Secrets**, click **Add**.
3. Add the first secret:
   - **Type**: Secret (encrypted)
   - **Variable name**: `TURNSTILE_SECRET_KEY`
   - **Value**: *(Your Turnstile private Secret Key from Cloudflare Turnstile)*
4. Add the second secret:
   - **Type**: Secret (encrypted)
   - **Variable name**: `DISCORD_WEBHOOK_URL`
   - **Value**: *(The Discord Webhook URL you copied in Step 1)*
5. Click **Save and deploy**.

---

### Step 4: Get Your Worker URL & Update HareBrain

1. On your Worker page, you will see your Worker's public URL, for example:
   `https://harebrain-feedback.<your-subdomain>.workers.dev`
2. Open `js/app.js` in HareBrain.
3. At the top of `js/app.js`, set:
   ```javascript
   const FEEDBACK_API_ENDPOINT = "https://harebrain-feedback.<your-subdomain>.workers.dev";
   ```
4. Commit and push to GitHub!

Now, whenever a user submits feedback or reports a bug on `harebrain.win`, you'll receive an instant, formatted Discord notification with full calculation details and a 1-click link to reproduce their board state!
