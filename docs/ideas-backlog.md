# Portfolio / RahulOS — Idea Backlog

Suggestions for future work, not yet planned or scheduled. Pick any of these up later with the brainstorming skill to turn into a real spec + plan.

## High impact for visitors

1. **Mobile fallback** — a Win98 desktop is nearly unusable on a phone. Either a simplified mobile layout, or a "best viewed on desktop" landing page that still surfaces resume/links.
2. **SEO + OpenGraph polish** — proper title, description, and preview image so sharing the link (LinkedIn, WhatsApp, etc.) shows a real preview card instead of a blank one.
3. **Vercel Analytics** — free tier, one-line setup. See what visitors actually click (My Details? Games? Do they leave fast?) to prioritize future work.

## Fun OS-themed features

4. **Recycle Bin** — pairs with the existing "Remove from Desktop" feature: removed icons land in the bin and can be restored from there, not just via Start Menu search.
5. **MS-DOS Prompt / Terminal app** — fake command prompt with commands like `help`, `about`, `resume`, `open calculator`, `dir`, plus easter eggs. Also doubles as keyboard-driven navigation.
6. **Sound effects** — startup chime, error ding, click sounds, with a mute toggle in Settings.
7. **Screensaver** — after ~2 min idle, a CSS "flying windows" or starfield screensaver; any input dismisses it.
8. **Blue Screen of Death easter egg** — hidden trigger or fake "crash" action; press any key to "reboot."

## Technical polish

9. **Lazy-load the DOS games** — Doom/OregonTrail/Scrabble bundles are likely heavy; load them only when launched to speed up first paint.
10. **Notepad ↔ My Computer integration** — Notepad saves files to localStorage, which then appear as documents in My Computer and can be reopened. Makes the "OS" feel more real/integrated.

## Also discussed, not yet decided

- **Retro-skinned iframe "Browser" app** — old Netscape/Firefox-style chrome (address bar, back/forward, tabs) wrapping a real `<iframe>`. Real constraint: most sites (YouTube's main site, Instagram, Google, etc.) block iframe embedding via X-Frame-Options/CSP, so it would only work for iframe-friendly sites, plus specific YouTube videos via the `youtube.com/embed/VIDEO_ID` player (full audio/video works there, general browsing does not). User hasn't confirmed whether this narrower scope is still worth building.
