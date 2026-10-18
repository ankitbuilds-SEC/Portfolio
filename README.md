# Ankit Portfolio

This portfolio is a responsive Full Stack Web Developer and Generative AI Developer experience with an editorial red-and-pink visual identity, published education, a real-projects-only showcase, an AI assistant, and a secure contact/admin system.

## Local development

1. Copy `.env.example` to `.env`, then set a unique `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and long random `ADMIN_SESSION_SECRET`. The server deliberately refuses admin operations if any of these are missing.
2. Install dependencies:
   npm install
3. Start the app:
   npm start
4. Open http://localhost:3000

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, create a new Web Service from the GitHub repository.
3. Use the existing `render.yaml` file.
4. Set your real environment values in Render Dashboard under Environment:
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   - ADMIN_SESSION_SECRET
   - CORS_ALLOWED_ORIGINS (only when a separate trusted frontend origin needs API access; comma-separated exact origins)
   - OPENAI_API_KEY (optional, for live assistant responses)
   - OPENAI_MODEL (optional; defaults to `gpt-4o-mini`)
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASSWORD
   - ADMIN_EMAIL
   - EMAIL_FROM_NAME
5. Deploy the service.

## Admin dashboard

Visit:
- `/admin`

Use the username and password configured in your production environment.

## Notes

- The app uses SQLite locally by default.
- SQLite files are private local data and are excluded from Git. Back up `database/messages.db` separately; do not commit it.
- Local `.env` values are loaded by the server. Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` to enable live OpenAI responses; without a key, the assistant answers from published portfolio data.
- Admin authentication requires all three configured values; there are no built-in credentials. Render generates the password and session secret, while the admin username must be set for the service.
- Cross-origin API requests are denied unless the exact requesting origin is listed in `CORS_ALLOWED_ORIGINS`. Same-origin requests do not need this setting.
- In Render, configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as environment variables. The API key stays on the server and must never be added to frontend files.
- If you configure Supabase, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment.
- The contact form stores valid submissions in the database and supports admin actions such as read/reply/archive/delete.
