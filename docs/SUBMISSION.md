# Devpost submission draft

## Project name

imakore

## Tagline

Write without organizing. Notice what keeps returning.

## Track

Apps for your life

## Short description

imakore is a privacy-first thought companion for people whose minds do not stop. Instead of asking users to choose folders, tags, priorities, or deadlines, it gives them one quiet place to write. Over time, it automatically finds words that recur across thoughts and lets users return to the moments behind those themes. The current MVP runs as an installable iPhone PWA, works offline, and keeps thought data and analysis on the device.

## Inspiration

Most note and productivity tools create a second job: organizing what you just wrote. That is especially difficult when your head is already full. We wanted a tool that feels lighter after use—not another system to maintain.

## What it does

Users write a thought in one large field and tap “残す” (keep it). imakore records the time automatically, preserves drafts, and builds a chronological history. Once enough thoughts accumulate, it uses on-device Japanese word segmentation to surface recurring themes. Tapping a theme filters the history to the related thoughts. Users can also search, edit, delete, export, and restore their records. A removable sample dataset lets first-time visitors experience the complete insight loop immediately.

## How we built it

The submitted product is a React/vinext PWA deployed with OpenAI Sites. Local persistence uses browser storage, and `Intl.Segmenter` performs Japanese tokenization without transmitting private thought text. A service worker provides offline behavior and update-safe caching. The repository also contains the original SwiftUI + SwiftData native prototype.

Codex was used as the primary product and engineering collaborator: narrowing the scope, implementing both prototypes, reviewing UX against the “no forced organization” principle, building the analysis logic, improving accessibility and dark mode, running builds and regression checks, deploying the site, and preparing the submission materials.

Before submitting, add one verified sentence describing the exact GPT-5.6 Codex workflow used in the final session and include that session's `/feedback` ID.

## Challenges

The hardest design decision was deciding what not to build. A theme-analysis feature can easily become another dashboard or classification system. We kept the interaction passive and local: the user never labels a thought, and insights only appear when a word genuinely recurs across multiple entries. We also had to make a browser-local product feel trustworthy, which led to explicit privacy copy plus export/import backup.

## Accomplishments

- A complete capture-to-insight loop with only two primary tabs
- Japanese recurring-theme analysis without an external AI request
- A realistic first-run judging experience in under 30 seconds
- Offline installable behavior on iPhone
- Accessible labels, scalable typography, dark mode, and reduced-motion support
- Both native SwiftUI and deployable PWA implementations in one repository

## What we learned

Reducing cognitive load is not only a copy or visual-design problem; it changes the architecture. Local-first analysis removes account setup and privacy hesitation. Sample data is also more than a demo convenience: it teaches the product by letting users experience the result before committing their own thoughts.

## What's next

The next experiment is an optional GPT-assisted weekly reflection that summarizes recurring themes without turning them into tasks. It would be opt-in, clearly separated from the local-only core, and designed with explicit consent and cost controls. Encrypted cross-device sync and a native App Store version would follow only after validating the current loop.

## Links

- Demo: https://imakore.midorin82.chatgpt.site
- Repository: https://github.com/kikurin-tasogare/imakore
- Demo video: **add public YouTube URL**
- Codex `/feedback` session ID: **add verified session ID**
