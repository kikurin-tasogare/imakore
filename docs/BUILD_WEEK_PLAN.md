# Build Week product plan

## Product promise

**Write without organizing. Notice what keeps returning.**

The target audience is a person whose thoughts keep moving and who feels more burdened—not helped—when a tool asks for tags, priorities, folders, or deadlines.

## Priority decisions

### P0 — submission-critical

- [x] One-step thought capture with automatic timestamps
- [x] Persistent draft, history, detail, edit, and confirmed deletion
- [x] Automatic recurring-theme discovery without manual classification
- [x] Theme-to-history navigation
- [x] First-use explanation and removable sample experience
- [x] Device-local privacy explanation
- [x] JSON export/import so local records are not a dead end
- [x] Installable, offline-capable iPhone PWA
- [x] Dark mode, scalable text, keyboard, and VoiceOver-friendly labels
- [x] Production build, lint, and regression checks

### P1 — strengthens the complete product experience

- [x] Full-text search
- [x] No-result and empty states
- [x] Demo-ready sample dataset that produces visible themes immediately
- [x] Build Week README, submission copy, demo script, and checklist

### P2 — intentionally deferred

- [ ] Optional GPT-assisted weekly reflection
- [ ] Cross-device encrypted sync
- [ ] Native App Store distribution
- [ ] More advanced semantic clustering and trend comparison

P2 is deferred because the MVP's distinctive value is reduced cognitive load. Adding API setup, accounts, or configuration before validating the core loop would weaken that promise.

## Success criteria

- A first-time judge can understand the product within 15 seconds.
- A first-time judge can reach a visible recurring-theme insight within 30 seconds using sample data.
- A user can save a real thought with one text field and one button.
- No thought content leaves the device in the current MVP.
- The primary demo flow fits comfortably in a video under three minutes.

## Build Week judging alignment

- **Technological implementation:** local Japanese segmentation, theme indexing, offline PWA, import/export, accessibility, and a parallel SwiftData prototype.
- **Design:** two-tab coherent product experience with deliberate constraints and native-feeling interactions.
- **Potential impact:** removes organizational burden for overthinkers and preserves thoughts that would otherwise be lost.
- **Quality of idea:** treats reflection—not task conversion—as the outcome, while keeping analysis private and automatic.
