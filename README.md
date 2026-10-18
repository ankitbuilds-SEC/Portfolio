# Ankit Kumar — Developer Portfolio

Responsive red-and-pink portfolio for Ankit Kumar, a B.Tech student focused on Full Stack Web Development and Generative AI.

## Current architecture

- Static HTML, CSS, and vanilla JavaScript frontend.
- Lightweight Node.js API in `backend/server.js`.
- No React, Vite, or PostgreSQL code exists in the current repository.
- GitHub Pages hosts the frontend only; the Node API needs a separate host.

## Features

- Responsive navigation, accessibility labels, focus states, and reduced-motion support.
- Cherry-red and blush-pink design with day/night mode.
- Hero and About portrait using `tcs pic.jpeg`.
- Verified education content and an intentionally empty Projects section.
- Client-side contact validation that opens a prefilled email draft.
- AI portfolio assistant with server-side OpenAI integration and a safe portfolio fallback.

## Local development

Run the API from the project root:

```powershell
$env:OPENAI_API_KEY="your-valid-openai-key"
npm start
```

Serve the static frontend from another terminal and open `index.html`. On localhost the frontend uses `http://localhost:3000` for API calls.

Without `OPENAI_API_KEY`, the assistant responds from approved portfolio data and reports `provider: offline`; it does not invent projects or experience.

## API routes

- `GET /api/health`
- `GET /api/profile`
- `GET /api/skills`
- `GET /api/education`
- `GET /api/projects` — returns an empty array until real projects are supplied.
- `GET /api/chatbot/status`
- `POST /api/chatbot/message`

Configure `CORS_ALLOWED_ORIGINS` when hosting the API separately. Never put `OPENAI_API_KEY` in frontend files or commit a `.env` file.

## Deployment

The frontend deploys automatically to:

https://ankitbuilds-sec.github.io/Portfolio/

To make the chatbot use the real AI service in production, deploy `backend/server.js` to a Node-compatible host, set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `CORS_ALLOWED_ORIGINS`, then define `window.__API_BASE__` before `js/script.js` loads.
