# Portfolio — Rahul Krishna A

Personal portfolio site, forked from [henryjeff's 3D portfolio](https://github.com/henryheffernan/portfolio-website) and reworked with my own content. Live 3D landing page that leads into a simulated desktop OS with a "My Details" app.

## Structure

This is a monorepo with two independently deployed apps:

- **`outer/`** — 3D landing page (Three.js + Webpack 5 + Express). Renders a room scene; clicking the in-scene computer opens the inner site in an iframe.
- **`inner/`** — Simulated desktop OS (Create React App). Hosts the "My Details" showcase app (about, skills, experience, projects, certifications, etc.) as a window inside the fake desktop.

## Development

```bash
# outer (3D landing page)
cd outer
npm install
npm run dev

# inner (desktop OS)
cd inner
npm install
npm start
```

## Deployment

Each app deploys as its own Vercel project from this repo (different root directory per project). `outer` embeds `inner` via an iframe — see `outer/src/Application/World/MonitorScreen.ts` for the inner site URL.

The contact form is a Vercel serverless function at `outer/api/send-email.js` (nodemailer over Gmail SMTP).
