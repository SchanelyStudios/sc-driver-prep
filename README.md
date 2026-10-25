# SC Driver Prep

A Next.js App Router prototype for studying the South Carolina driver's manual, built with TypeScript, Tailwind CSS 4 and local Headless UI wrappers.

## Run

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Enter an email to create or resume a profile on the same browser. This is local identification, not authentication. Email, study answers and scores stay in browser storage; clearing site data removes them. The app needs no backend, environment secrets or externally fetched fonts.

## Learning experience

- All 11 instructional sections are available immediately, with a desktop sidebar and mobile hamburger flyout.
- Guided practice checks each answer immediately and links to the source manual.
- Section reviews cover mapped objective groups, show explanations after submission, and pass at exactly 85% or higher.
- A 40-question comprehensive review is available as a pretest; first, latest and best results are retained.
- Recommendations identify topics missed across recent reviews. Earned passes stay earned after failed retakes.
- Attempts resume after refresh with the same questions, choice order and answers. Profile switching, explicit clearing and storage-failure notices are included.
- Section 12 is reference-only.

The 327-item bank includes 14 sign images. The original 20 Section 5 pilot items and the Section 9 repair-aftercare question were approved; 306 other items remain prototype drafts. The stuck-accelerator emergency sequence and other documented ambiguous facets are excluded. Section reviews cover mapped groups, not every atomic fact in every attempt. Editorial completion remains necessary before broader release.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run format:check
npm run build
npm start
```

Playwright uses `/usr/bin/chromium` when available. On another machine, run `npx playwright install chromium` first. Tests start the dev server automatically if needed. Browser tests use isolated storage and test profiles.

See [architecture and coding standard](docs/architecture.md) for the Bulletproof React mapping, component bank, styling conventions, persistence design and test strategy. Files use kebab-case; feature boundaries and classname conventions have ESLint checks. Run `npm run format` after edits.
