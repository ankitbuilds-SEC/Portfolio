# Ankit Kumar — Developer Portfolio

A responsive static portfolio for Ankit Kumar, a B.Tech student specializing in Artificial Intelligence and Data Science with a focus on full stack web development and Generative AI.

## Features

- Premium dark pink-and-red visual system with responsive layouts.
- Semantic HTML, keyboard-friendly navigation, visible focus states, and reduced-motion support.
- Mobile navigation, active section highlighting, project category filters, reveal animations, copy-email feedback, dynamic copyright year, and back-to-top control.
- Contact form validation that opens a prefilled email draft; it does not claim to send messages from static hosting.
- GitHub Pages-ready relative asset paths and custom 404 page.

## Technologies

HTML5, CSS3, vanilla JavaScript, Google Fonts, and inline SVG placeholders. No framework or backend is required.

## Personal details

- **Name:** Ankit Kumar
- **Headline:** Full Stack Web Developer | Generative AI Developer
- **College:** Sengunthar Engineering College
- **Degree:** B.Tech, Artificial Intelligence and Data Science (2023–2027)
- **CGPA:** 7.8/10
- **Email:** ankitkumar.data39@gmail.com

## Local development

Open `index.html` directly for a quick preview, or use a local static server:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```text
index.html · 404.html
assets/     images, icons, and resume instructions
css/        style.css and responsive.css
js/         script.js
docs/       deployment notes
```

## Resume and project content

Add the real PDF at `assets/resume/Ankit_Kumar_Resume.pdf`. The project cards are explicitly editable examples and should be replaced with verified projects, repository URLs, live demos, and real screenshots before presenting them as completed work.

## GitHub Pages deployment

```powershell
git status
git remote -v
git add index.html 404.html assets css js README.md docs .gitignore
git commit -m "Build responsive pink and red developer portfolio"
git push origin main
```

In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. GitHub’s deployment status should be checked before calling the site live.

Expected URL: `https://ankitbuilds-SEC.github.io/Poertfolio-Ankit/` (not verified by this local build).

## Future improvements

Add the actual resume, replace example projects with verified work, add project screenshots and links, and connect the form to a configured form service if direct submissions are needed.
