# Personal development workflow

This note is for me. It captures how I prefer to think and work when building software, so I spend less energy deciding *what to do next* and more energy doing it well. I will refine it as I learn.

---

## Why this document exists

- I want a **default rhythm** that matches how my mind works: stabilize tooling, then see structure in the browser, then grow behavior, then harden edges when I can.
- I want **one place** for that rhythm, testing habits, and reminders—instead of re-deciding from scratch every session.
- It is **not** a contract with anyone else; it is a tool to reduce friction and frustration when life is busy and many topics compete for attention.

---

## Non-negotiable vs flexible

**Non-negotiable:** I aim for **high-quality code**: clear structure, honest boundaries between layers, maintainability, and tests where they earn their keep. “Shipped” is not enough if the code would embarrass me in a review.

**Flexible:** The **order** of steps below is a **guide**, not a mandatory checklist. Some days I will sketch logic before polish; other days I need the UI shell first so my brain can “see” the problem. What stays fixed is the standard of quality, not the sequence of keystrokes.

---

## Default workflow (how I usually face a feature or project)

These steps describe my **typical** path. I may skip ahead or circle back; that is allowed.

### Step 1 — Development environment ready

The project runs: install works, build and dev server work, type-check passes, linting and formatting are wired, and tests can run. Until this is sane, everything else costs more.

*(For this TodoMVC-style project, that baseline includes TypeScript, Webpack, ESLint, Stylelint, Prettier, Jest with a sensible config, and alignment with the architecture notes in `DESIGN_GUIDE.md`.)*

### Step 2 — Markup, folder layout, and something on screen

- **Folder structure** reflects the architecture I intend (for example: domain, services, UI, templates—not one flat pile of files).
- **Markup and styles** are enough that the main views **render in the browser**, even if data is static or placeholder at first.

This step gives me a visible skeleton. It answers: “Does the shape of the app match how I think about it?”

### Step 3 — Interactivity and logic

I wire behavior: state, user actions, data flow (in this project: RxJS and unidirectional flow as described in the design guide), persistence when relevant, and integration between layers.

This is where most of the “real” programming happens, built on a stable shell instead of fighting the tooling.

### Step 4 — Hardening

When I get here, I use a short checklist so I do not forget the edges:

- [ ] **Errors:** handling and messaging where it matters; avoid silent breakage.
- [ ] **Persistence edge cases:** empty storage, corrupt or unexpected data, sensible limits.
- [ ] **Accessibility (a11y):** only if I scoped it—keyboard, labels, focus, contrast, as I committed to.

This step turns “it works on my happy path” into something I trust a bit more under real use.

---

## Unit testing (how I want to work)

I am not claiming strict test-driven development for every line. I am choosing a **practical split** that fits how I learn and build.

1. **Logic first, locked with tests**  
   When I have **pure behavior**, **domain rules**, or **services** (state transitions, parsing, filtering, persistence helpers), I write tests **soon after** (or alongside) that logic so behavior is **locked** before I pile more code on top.

2. **Components and DOM after stabilization**  
   When the UI is still moving quickly (markup churn, selectors changing), heavy DOM tests can fight me. Once a piece of UI **stabilizes**—clear responsibilities, less rename churn—I add tests that care about **behavior** (what the user sees or what events fire), not every pixel.

3. **Exceptions I accept**  
   Regression bug: add a failing test if possible, then fix. Refactor: tests protect what already worked.

This rhythm matches the goal: **confidence in logic early**, **reasonable effort on UI tests** when the shape stops shifting.

---

## When I am stuck

Short list to reuse:

- Shrink the problem: one screen, one action, one branch of state.
- Draw or write the data flow (even five lines on paper): action → store → view.
- If logic is unclear, write or extend a **small test** that states the expected outcome.

---

## Living document

I will **update this file** as patterns prove useful or wrong—for example, after finishing a milestone on this project or after noticing repeated mistakes.

Last refined: restored personal tone; **checklist-style kept only for Step 4 (Hardening)**; earlier refinements: Step 4 added, testing split, flexible order vs quality bar.
