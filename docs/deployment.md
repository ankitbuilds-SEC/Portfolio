# Deployment checklist

## Frontend

1. Push changes to `main`.
2. GitHub Actions runs `.github/workflows/deploy-pages.yml`.
3. Verify the published site at https://ankitbuilds-sec.github.io/Portfolio/.
4. Check navigation, images, Projects empty state, theme toggle, and contact email draft.

## API and chatbot

GitHub Pages cannot execute Node.js. Deploy `backend/server.js` separately on a Node host.

Set these server environment variables:

```text
OPENAI_API_KEY=<server-only secret>
OPENAI_MODEL=gpt-4o-mini
CORS_ALLOWED_ORIGINS=https://ankitbuilds-sec.github.io,http://localhost:4173
```

Set `window.__API_BASE__` in the frontend to the deployed API origin before `js/script.js` loads. Verify `/api/health`, `/api/chatbot/status`, and a `POST /api/chatbot/message` request without exposing the API key.

## Current limitation

The public frontend is deployed and verified. The API is implemented and locally testable, but it is not publicly hosted by GitHub Pages.
