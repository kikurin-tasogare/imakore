# imakore

> Capture what is in your head now, then notice the themes that keep returning.

imakore is a privacy-first thought companion for people whose minds do not stop. It removes the work of tagging, prioritizing, and organizing: write a thought, leave it there, and come back later to see recurring words and the related moments behind them.

**OpenAI Build Week track:** Apps for your life<br>
**Live demo:** [imakore.midorin82.chatgpt.site](https://imakore.midorin82.chatgpt.site)

## The problem

People often lose useful thoughts because conventional tools ask them to make another decision: which folder, tag, priority, deadline, or project does this belong to? When the mind is already full, organizing becomes more work.

imakore is designed around a smaller promise: write now, organize nothing, notice the flow later.

## What it does

- Captures a thought in one large, distraction-free text area
- Saves created and updated timestamps automatically
- Keeps unfinished drafts on the device
- Shows thoughts newest-first with full detail, editing, and deletion
- Finds words that recur across multiple thoughts using on-device Japanese segmentation
- Filters related thoughts by recurring theme
- Searches the complete local history
- Exports and imports a JSON backup
- Includes removable sample thoughts so judges can experience insights immediately
- Works as an installable iPhone PWA, including offline use and dark mode

No account, AI API, external analytics, tag, priority, deadline, or calendar is required. Thought data and analysis stay in the browser on the device.

## Why it is different

imakore is not a ToDo manager and does not turn every thought into an obligation. Its core interaction is intentionally quiet:

```text
残す → 自動で流れを見つける → 過去の自分へ戻る
Capture → notice the flow → return to your past self
```

## Try the judging flow

1. Open the [live demo](https://imakore.midorin82.chatgpt.site) on an iPhone or desktop browser.
2. Select **振り返る**.
3. Select **サンプルで体験する**.
4. Tap a recurring theme such as **写真** or **音楽**.
5. Open a related thought, then try search, edit, and data export.
6. Remove the sample data when finished.

## Built with Codex

Codex was the primary development environment for:

- turning a personal problem into a narrow product specification;
- implementing the SwiftUI prototype and production PWA;
- designing the privacy-first local analysis algorithm;
- improving Japanese copy, accessibility, offline behavior, and responsive UI;
- running build, lint, regression, packaging, and deployment workflows;
- preparing the Build Week story, demo script, and submission checklist.

For the Build Week submission, include the `/feedback` session ID from the confirmed GPT-5.6 Codex session used for the final core implementation/review. Do not claim a model version that has not been verified in Codex.

## Architecture

The submitted experience is the PWA in [`web/`](web/). A SwiftUI + SwiftData native prototype is preserved in [`imakore/`](imakore/) and [`imakore.xcodeproj`](imakore.xcodeproj/).

```text
web/app/ImakoreApp.tsx   Product behavior and local analysis
web/app/globals.css      Responsive iPhone-first design
web/public/sw.js         Offline cache and PWA updates
web/tests/               Product and installability checks
docs/                    Build Week plan, submission copy, and demo script
```

The PWA uses React, vinext, and Cloudflare-compatible Sites output. Thoughts are stored in `localStorage`; `Intl.Segmenter` performs Japanese word segmentation locally. No thought text is sent to a server.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
cd web
pnpm install
pnpm dev
```

Validation:

```bash
pnpm build
pnpm lint
node --test tests/*.test.mjs
```

## Privacy and limitations

- Data remains in the current browser profile unless the user exports it.
- Clearing Safari website data removes local thoughts.
- Data does not currently sync across devices.
- Theme detection is intentionally lightweight and local; it is not a psychological or medical assessment.

## Build Week materials

- [Product priorities](docs/BUILD_WEEK_PLAN.md)
- [Devpost submission draft](docs/SUBMISSION.md)
- [Demo video script](docs/DEMO_SCRIPT.md)
- [Final submission checklist](docs/SUBMISSION_CHECKLIST.md)

## License

[MIT](LICENSE)
