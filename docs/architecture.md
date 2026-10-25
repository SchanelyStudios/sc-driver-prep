# Architecture and coding standard

This prototype uses [Bulletproof React](https://github.com/alan2207/bulletproof-react) as an architectural reference, adapted to Next.js App Router. Reviewed guidance: [project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md), [components and styling](https://github.com/alan2207/bulletproof-react/blob/master/docs/components-and-styling.md), [project standards](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md), and [testing](https://github.com/alan2207/bulletproof-react/blob/master/docs/testing.md).

## Dependency direction

`app → features/study → components/ui + lib`

- `src/app`: route composition, document metadata, global CSS entry point.
- `src/features/study`: content, types, pure assessment logic, persistence adapter, subscription hook, and feature components. No server/API layer is needed for browser-local profiles.
- `src/components/ui`: reusable primitives and local Headless UI wrappers. These never import features or application routes.
- `src/styles/tokens.css`: centralized semantic Tailwind color, typography-family, radius, and shadow tokens.
- Imports target concrete modules. The data module contains actual content assembly, not a feature-wide barrel.

Use strict TypeScript, kebab-case files, explicit variant maps and colocated styles. ESLint enforces dependency direction, disallows Headless UI imports outside the wrapper layer, and rejects literal/template-literal JSX classnames and inline style props. Prettier formats the project. New features should remain independent and be composed at the app layer.

## Component bank

- `Text`: controlled display, title, heading, question, body, small, caption, eyebrow, and metric specs; semantic element selectable separately.
- `Box`: controlled flex direction, gap, alignment, justification, wrapping and semantic container.
- `Card`, `Badge`, `Progress`, `Icon`, `ActionLink`: recurring visual language.
- `Button`, `EmailField`, `ChoiceGroup`, `Dialog`, `Disclosure`: local wrappers around Headless UI interactions.

Class strings belong to a file-level styles/variants constant. Prefer existing variants over ad hoc typography. Feature code can compose shared primitives but should not depend on Headless UI directly. Keep the palette semantic; change token values to retheme the application. No external font requests or image services are required.

## Content and assessments

The bank contains 327 original practice items from the reviewed planning package, including 14 extracted warning-sign assets. Only the original 20 Section 5 pilot items and the Section 9 repair-aftercare item have user editorial approval; the other 306 remain prototype drafts. All sections are available for prototype development, not a claim of public-release editorial completion. Source identity and content version travel with every attempt.

Section reviews cover each mapped objective group and fill to the section target. This is not exhaustive atomic-fact coverage. Section 6 and the 40-question comprehensive review require an image question. The comprehensive blueprint samples all 11 instructional sections; Section 12 is reference-only. The disputed steering range, brake-failure engine-off steps, stuck-accelerator recovery sequence and school-bus resumption wording remain excluded. The approved stuck-accelerator question covers repair before driving again.

Passing uses `correct * 100 >= total * 85`; rounding never determines passing. Review responses may change until submission. Unanswered responses count as incorrect after explicit confirmation. Practice answers lock when checked and never grant a pass. Earned section passes survive failed retakes.

## Local persistence

Email entry selects a browser-local profile; it is not authentication. No email or answer analytics are sent to a backend. Storage keys contain no email. A versioned, validated repository adapter isolates persistence from UI. Corrupt/unknown-version data stays intact; an explicit user-confirmed reset is available. Failed writes remain in memory with an unsaved-progress notice. Cross-tab storage changes refresh the active state.

Attempt snapshots retain selected questions, choice order, answers, practice checks, cursor, source and bank versions. Refresh resumes the saved screen and attempt. Only completed comprehensive reviews enter first/latest/best history; the first remains the baseline even after improvements. Content changes do not regrade history. This prototype does not claim protection from browser owners editing storage, cross-device sync, or verified identity.

## Validation

Native Node tests exercise assessment boundaries, coverage, randomization, response locking, pass retention, baseline retention, recommendations and saved-data validation. Playwright uses the real browser, Headless UI controls and local storage for learning flows, navigation, reloads, profiles and error handling. It uses system Chromium in the cloud environment; elsewhere run `npx playwright install chromium` once.
