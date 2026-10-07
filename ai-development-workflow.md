# AI Development Workflow

How I apply AI-driven software development in practice: workflow phases, what happens in each phase, and which skills in this repository support them.

For principles — developer control, skills-first, progressive complexity — see [`ai-development-philosophy.md`](./ai-development-philosophy.md).

---

## Overview

Development follows eight phases. Each phase has a purpose, a gate, and one or more skills that support it.

Not every task uses every phase or every skill. Trivial work (rename, typo, obvious fix) can skip early phases when requirements are already clear. The workflow describes the **full path** for non-trivial work.

```
Phase 1  Context validation     →  confirmed intent
Phase 2  Planning               →  spec + task breakdown
Phase 3  Implementation         →  code (small steps)
Phase 4  Developer validation  →  approved step
Phase 5  Incremental progress   →  commit, next step
Phase 6  Peer review (optional) →  PR when appropriate
Phase 7  Commit history         →  meaningful progression
Phase 8  Final validation      →  ship-ready change
```

Phases 3–5 repeat in a loop until the work is complete. Phases 6–8 apply at review boundaries and at the end.

**Meta skill:** [`skills/using-agent-skills/SKILL.md`](../skills/using-agent-skills/SKILL.md) — discover which skill applies; core behaviors (surface assumptions, push back, scope discipline, verify) apply throughout.

---

## Phase 1 — Context Validation

**Purpose:** Understand the request, validate assumptions, and confirm intent before planning or implementation.

**What happens:**

- Restate what is being asked
- Surface assumptions explicitly
- Identify constraints, ambiguities, and missing information
- Confirm shared understanding with an explicit **yes**

**Gate:** Do not plan or implement until intent is confirmed.

**Output:** Confirmed statement of intent (optionally saved to `docs/intent/<topic>.md` in the project repo).

**Primary skill:**

| Skill | Path | When |
|-------|------|------|
| `interview-me` | [`skills/interview-me/SKILL.md`](../skills/interview-me/SKILL.md) | Underspecified or assumption-heavy requests; invoke explicitly |

**Outside this workflow loop:**

| Skill | Path | When |
|-------|------|------|
| `idea-refine` | [`skills/idea-refine/SKILL.md`](../skills/idea-refine/SKILL.md) | Raw or vague product ideas **before** they enter this development workflow (e.g. entrepreneurship ideas) |

**Skip Phase 1 when:** The request is unambiguous and self-contained, or intent was already confirmed in a prior session (continue from the saved artifact).

---

## Phase 2 — Problem Understanding and Planning

**Purpose:** Create a structured breakdown of the work that becomes the baseline for implementation.

**What happens:**

- Define the problem and scope from confirmed intent
- Identify domain concepts, architecture, boundaries, and dependencies
- Break work into individual implementation steps
- Define how each step will be validated

**Gate:** Do not implement until the plan or spec is reviewed and agreed.

**Input:** Confirmed intent from Phase 1 (e.g. `docs/intent/<topic>.md`).

**Output:** Specification and/or task plan (e.g. spec document, `tasks/plan.md`, `tasks/todo.md`).

**Primary skills:**

| Skill | Path | Role |
|-------|------|------|
| `spec-driven-development` | [`skills/spec-driven-development/SKILL.md`](../skills/spec-driven-development/SKILL.md) | Requirements, spec, plan, and tasks with human review gates |
| `planning-and-task-breakdown` | [`skills/planning-and-task-breakdown/SKILL.md`](../skills/planning-and-task-breakdown/SKILL.md) | Decompose spec into ordered, verifiable tasks when a separate breakdown pass is needed |

**Supporting skills (use when the work requires them):**

| Skill | Path | When |
|-------|------|------|
| `api-and-interface-design` | [`skills/api-and-interface-design/SKILL.md`](../skills/api-and-interface-design/SKILL.md) | API or interface contracts are part of the plan |
| `documentation-and-adrs` | [`skills/documentation-and-adrs/SKILL.md`](../skills/documentation-and-adrs/SKILL.md) | Architectural decisions should be recorded during planning |
| `constraint-driven-development` | [`skills/constraint-driven-development/SKILL.md`](../skills/constraint-driven-development/SKILL.md) | Quality or scope constraints must be set once and enforced |

---

## Phase 3 — Step-by-Step Implementation

**Purpose:** Implement the plan incrementally. Each step is small enough to understand and validate on its own.

**What happens:**

- Implement one plan step or task at a time
- Keep changes traceable to the agreed plan
- Load relevant context before touching unfamiliar code

**Gate:** Do not start the next step until Phase 4 approves the current one.

**Input:** Spec and task list from Phase 2.

**Primary skills:**

| Skill | Path | Role |
|-------|------|------|
| `incremental-implementation` | [`skills/incremental-implementation/SKILL.md`](../skills/incremental-implementation/SKILL.md) | Build in thin vertical slices |
| `test-driven-development` | [`skills/test-driven-development/SKILL.md`](../skills/test-driven-development/SKILL.md) | Prove behavior with tests as you build |
| `context-engineering` | [`skills/context-engineering/SKILL.md`](../skills/context-engineering/SKILL.md) | Load the right codebase context before implementing |

**Supporting skills (by type of work):**

| Skill | Path | When |
|-------|------|------|
| `frontend-ui-engineering` | [`skills/frontend-ui-engineering/SKILL.md`](../skills/frontend-ui-engineering/SKILL.md) | UI implementation |
| `api-and-interface-design` | [`skills/api-and-interface-design/SKILL.md`](../skills/api-and-interface-design/SKILL.md) | API implementation |
| `source-driven-development` | [`skills/source-driven-development/SKILL.md`](../skills/source-driven-development/SKILL.md) | Implementation must match official docs or specs |
| `debugging-and-error-recovery` | [`skills/debugging-and-error-recovery/SKILL.md`](../skills/debugging-and-error-recovery/SKILL.md) | Fixing bugs or failures during implementation |
| `doubt-driven-development` | [`skills/doubt-driven-development/SKILL.md`](../skills/doubt-driven-development/SKILL.md) | High-stakes or uncertain decisions before they stand |

---

## Phase 4 — Developer Judgment and Validation

**Purpose:** After each implementation step, stop and evaluate the result together. The developer decides whether to proceed.

**What happens:**

- Review what was implemented against the plan
- Check technical soundness, standards, and tests
- Approve, request changes, challenge the approach, or reject

**Gate:** Do not continue to the next implementation step until the current step is sufficiently validated and agreed.

**This phase is collaborative.** It is not fully encoded in a single skill — it is a required discipline supported by verification steps inside implementation and review skills.

**Skills that support validation:**

| Skill | Path | Role |
|-------|------|------|
| `test-driven-development` | [`skills/test-driven-development/SKILL.md`](../skills/test-driven-development/SKILL.md) | Evidence that behavior works |
| `code-review-and-quality` | [`skills/code-review-and-quality/SKILL.md`](../skills/code-review-and-quality/SKILL.md) | Structured review against standards and spec |
| `browser-testing-with-devtools` | [`skills/browser-testing-with-devtools/SKILL.md`](../skills/browser-testing-with-devtools/SKILL.md) | Runtime verification in the browser |

---

## Phase 5 — Incremental Progress

**Purpose:** Record approved progress and move to the next step.

**What happens:**

1. Record progress (commit when appropriate)
2. Decide whether this step also needs peer review (Phase 6)
3. Move to the next plan step
4. Repeat Phases 3–4

**Cycle:**

**Plan → Implement → Validate → Discuss → Agree → Commit → [Optional Peer Review] → Next Step**

Review granularity is a **developer decision** — not forced after every step.

**Primary skill:**

| Skill | Path | Role |
|-------|------|------|
| `git-workflow-and-versioning` | [`skills/git-workflow-and-versioning/SKILL.md`](../skills/git-workflow-and-versioning/SKILL.md) | Commits, branches, and history that reflect progress |

---

## Phase 6 — Peer Review Strategy

**Purpose:** Submit work for peer review at appropriate boundaries — without forcing a pull request after every commit.

**What happens:**

- For larger or longer work: open a PR after a plan step or a small group of related steps
- For smaller work: several approved commits may stay in one PR
- Keep reviews small, focused, and easier to validate

**Principle:** **Commits represent progress; pull requests represent review boundaries.** These are not required to be one-to-one.

**Primary skills:**

| Skill | Path | Role |
|-------|------|------|
| `code-review-and-quality` | [`skills/code-review-and-quality/SKILL.md`](../skills/code-review-and-quality/SKILL.md) | Review before merge |
| `code-simplification` | [`skills/code-simplification/SKILL.md`](../skills/code-simplification/SKILL.md) | Reduce unnecessary complexity before or during review |
| `security-and-hardening` | [`skills/security-and-hardening/SKILL.md`](../skills/security-and-hardening/SKILL.md) | Security-sensitive changes |

---

## Phase 7 — Commit-Based Development History

**Purpose:** Git history should tell the story of how the work evolved — not hide it in opaque bulk commits.

**What happens:**

- Each meaningful step is represented by a commit when practical
- History should show what was planned, implemented, in what order, and where judgment changed direction

**Primary skill:**

| Skill | Path | Role |
|-------|------|------|
| `git-workflow-and-versioning` | [`skills/git-workflow-and-versioning/SKILL.md`](../skills/git-workflow-and-versioning/SKILL.md) | Disciplined commits and branch strategy |

This phase is a **continuous discipline** across Phases 5–8, not a separate moment in time.

---

## Phase 8 — Final Validation and Ship

**Purpose:** Before merge or release, confirm the complete change satisfies the original requirements.

**What happens:**

- Run tests and validate the build
- Perform final checks and full review
- Create or update the pull request, summarize, request review
- Ship when ready

**Primary skills:**

| Skill | Path | Role |
|-------|------|------|
| `shipping-and-launch` | [`skills/shipping-and-launch/SKILL.md`](../skills/shipping-and-launch/SKILL.md) | Deploy and release safely |
| `ci-cd-and-automation` | [`skills/ci-cd-and-automation/SKILL.md`](../skills/ci-cd-and-automation/SKILL.md) | Pipeline and automation work |
| `code-review-and-quality` | [`skills/code-review-and-quality/SKILL.md`](../skills/code-review-and-quality/SKILL.md) | Final quality gate |

**Supporting skills (when relevant):**

| Skill | Path | When |
|-------|------|------|
| `performance-optimization` | [`skills/performance-optimization/SKILL.md`](../skills/performance-optimization/SKILL.md) | Performance is part of done |
| `observability-and-instrumentation` | [`skills/observability-and-instrumentation/SKILL.md`](../skills/observability-and-instrumentation/SKILL.md) | Logging, metrics, alerts |
| `deprecation-and-migration` | [`skills/deprecation-and-migration/SKILL.md`](../skills/deprecation-and-migration/SKILL.md) | Retiring or migrating existing behavior |

---

## Quick Reference

| Phase | Goal | Primary skills |
|-------|------|----------------|
| 1 | Confirmed intent | `interview-me` |
| 2 | Spec + plan | `spec-driven-development`, `planning-and-task-breakdown` |
| 3 | Implement step | `incremental-implementation`, `test-driven-development` |
| 4 | Developer approval | Validation via tests + review skills |
| 5 | Commit + next step | `git-workflow-and-versioning` |
| 6 | Peer review | `code-review-and-quality` |
| 7 | Meaningful history | `git-workflow-and-versioning` |
| 8 | Ship | `shipping-and-launch` |

---

## Example: Non-Trivial Feature

1. **Phase 1** — Run `interview-me` → save `docs/intent/feature-x.md` → explicit yes
2. **Phase 2** — Run `spec-driven-development` using that intent → agreed spec and tasks
3. **Phase 3–4** — One task at a time with `incremental-implementation` + `test-driven-development` → developer validates each step
4. **Phase 5** — Commit after each approved step via `git-workflow-and-versioning`
5. **Phase 6** — Open PR when the review boundary makes sense
6. **Phase 8** — Final checks, `code-review-and-quality`, merge with `shipping-and-launch` when applicable

This workflow is a living document. Update skill mappings here when practice shows a better fit.
