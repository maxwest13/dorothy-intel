# Dorothy Creative — Intel Dashboard

New business intelligence platform: lead gen, target research, 3-touch outreach sequences, pipeline tracking, and reply handling — all in one black-and-yellow war room.

## Deploy to Netlify (5 min)

### 1. Push to GitHub
```bash
cd dorothy-intel
git init
git add .
git commit -m "Dorothy Intel v1"
# Create a new repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/dorothy-intel.git
git push -u origin main
```

### 2. Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect GitHub → select `dorothy-intel`
3. Build settings auto-detected from `netlify.toml` (no changes needed)
4. Click **Deploy site**

### 3. Add your API key
1. In Netlify: **Site configuration** → **Environment variables** → **Add a variable**
2. Key: `ANTHROPIC_API_KEY`
3. Value: `sk-ant-...` (your key from [console.anthropic.com](https://console.anthropic.com))
4. Click **Save** → then **Trigger deploy** → **Deploy site**

That's it. Your dashboard is live at `https://your-site.netlify.app`.

---

## Local dev

```bash
npm install
npm install -g netlify-cli   # first time only

# Create .env from the template
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run locally (Netlify CLI runs functions + Vite together)
netlify dev
```

Open http://localhost:8888

---

## Notes

- Your API key is **never** in the browser — it lives in the Netlify serverless function
- Pipeline data is saved in browser localStorage (per-device)
- Web search requires the `web-search-2025-03-05` Anthropic beta (included automatically)
- Google Drive CRM check requires the Claude.ai MCP integration; it silently skips if unavailable
