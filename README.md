# EDM Dashboard — Web Version

Enterprise Delivery Manager Dashboard. Runs entirely in the browser. No server, no install, no build step.

## Files

| File | Purpose |
|------|---------|
| index.html | App shell and all UI |
| style.css | All styles |
| data.js | State management and default data |
| ai.js | AI config, API calls, PowerPoint export |
| app.js | All section logic (portfolio, risks, decisions, etc.) |
| jira.js | JIRA integration module |

## Run locally

Just open index.html in any modern browser. No server needed for basic use.

For JIRA integration, browsers block cross-origin requests to Atlassian — run a local server instead:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open http://localhost:8080

## Deploy to web

Drop all 6 files into any static host:

- **Netlify**: drag the folder into netlify.com/drop
- **GitHub Pages**: push to a repo, enable Pages on the main branch
- **Vercel**: `npx vercel` in the folder
- **Internal server**: copy files to any web server directory (Apache, Nginx, IIS)

No build process. No dependencies to install. Just static files.

## AI Setup

Click a preset in the top bar (OpenAI, Anthropic, Ollama, Groq, OpenRouter) or enter any OpenAI-compatible base URL manually. Paste your API key and hit Save. The key is stored in localStorage on your device only.

## JIRA Setup

Go to the JIRA section in the sidebar:
1. Enter your Atlassian Cloud URL (e.g. https://yourco.atlassian.net)
2. Enter your email and project key (e.g. PLAT)
3. Generate an API token at id.atlassian.com/manage-profile/security/api-tokens
4. Paste the token and hit Save, then Test Connection

## Data

All data is stored in browser localStorage. Use Export to save a JSON backup. Use Import to restore. Data persists across browser sessions on the same device.

## Email

Email uses mailto: links which open your default mail client pre-filled. For automated SMTP sending, use the Electron desktop version of this app.
