# AI Development Philosophy

How I think about AI-assisted software development: what the system is for, who stays in control, and which principles guide every decision about how AI is used.

For the practical workflow — phases, gates, and which skills to use — see [`ai-development-workflow.md`](./ai-development-workflow.md).

---

## Current Foundation

**Addy Osmani's `agent-skills` repository is my foundation AI system** for applying AI-driven software development today.

I am **not** building my own AI development system from scratch at this point. I use this existing system — skills, references, and workflows in this repository — as the starting point while I gain real experience applying AI-driven development on actual projects.

My personal layer lives in **`yeison/`**: philosophy, workflow mapping, and notes that describe how *I* apply the foundation. The upstream skills remain the engine; `yeison/` is where my judgment and customization accumulate over time.

If I later need a system that fits me more closely, I will not start from zero. I will use this foundation and everything I have learned from working with it — what worked, what did not, and what I would change — as the basis for deeper customization or a system of my own.

Until that need is clear from practice, **experience comes before reinvention.**

---

## Objective

I use AI to support a **strong, disciplined, repeatable, and effective** software-development workflow — not to replace engineering judgment or maximize automation for its own sake.

The goal is **not** to build the largest, most sophisticated, or most automated AI configuration possible.

The goal is the **smallest AI development system** that still delivers that workflow while remaining **completely understandable and controllable by the developer**.

I should always be able to answer:

- What capabilities the system has.
- Why each capability exists.
- How the capabilities interact.
- What the AI is doing at each stage and why.
- How the system can be modified or extended.

The system should grow stronger over time, but complexity is added only when there is a clear engineering reason — never because a capability happens to exist.

---

## Developer-Controlled, Not Autonomous

AI-assisted development is **developer-controlled**, not autonomous development.

**The developer remains responsible for engineering decisions.**

The AI is a development partner. It can analyze, challenge assumptions, research, design, plan, implement, validate, review, suggest improvements, and execute well-defined tasks — but it must not silently make important engineering decisions without giving the developer a chance to understand, evaluate, and agree.

The system optimizes for:

**Understanding → Collaboration → Agreement → Implementation → Validation → Progress**

Not:

**Prompt → Autonomous implementation → Finished code**

When the AI proposes a direction, the developer can approve, reject, refine, or redirect. Speed never overrides clarity at decision points that matter.

---

## Skills First

The foundation of the system is **skills** — explicit, readable workflows the agent follows when a task requires them.

Start with the simplest architecture:

**Skills first.**

Additional mechanisms — rules, hooks, agents, routing, automation, orchestration — are introduced only when skills alone cannot solve a recurring problem effectively.

Do not add mechanisms simply because they are available. Every addition must have a clear purpose and remain understandable to the developer.

Prefer a **small number of well-defined capabilities** over a large collection of loosely understood ones.

---

## System Qualities

The system should be:

- Simple
- Explicit
- Composable
- Understandable
- Developer-controlled
- Progressive
- Easy to modify, explain, and debug
- Grounded in strong software-engineering principles

Avoid unnecessary abstraction, automation, orchestration, or configuration complexity.

---

## Skill Design and Ownership

Skills are not black boxes. Before relying on a skill, I understand what it does and when it applies.

Prefer skills that are:

- Small
- Single-purpose
- Composable
- Explicit
- Easy to read and modify
- Easy to invoke within the workflow

When a skill does not match how I want to work, I modify it or create my own — rather than accepting behavior I do not understand.

Customizations belong in the **`yeison/`** layer when possible, so the foundation stays syncable and my changes stay visible.

A long-term goal is to become capable of **designing, evaluating, and maintaining** my own skills — not only consuming them.

---

## Progressive Complexity

The system evolves through **real development work**, not upfront design.

Start with the smallest useful set of capabilities. Use them on actual projects. Add complexity only when one of these is true:

- A recurring problem has been identified.
- A workflow step requires specialized behavior.
- A capability cannot be expressed clearly through an existing skill.
- Repetition justifies automation.
- A rule prevents recurring mistakes.
- A hook provides meaningful validation.
- Routing solves a real complexity problem.

Every addition needs a clear justification.

Avoid building infrastructure for hypothetical future problems.

Experience comes first; customization follows evidence — not the other way around.

---

## Transparency

At every stage, I should be able to answer:

> What is the AI doing right now, why is it doing it, and what artifact or decision will result?

Avoid opaque routing or hidden instructions that make behavior hard to explain.

If orchestration or automation is necessary, it is **explicit and documented**. If one skill leads to another, that relationship is understandable.

I should never need to trust a system simply because it appears to work.

---

## Engineering Quality

AI should **reinforce** strong software-engineering practices, not replace them.

The system should promote:

- Clear requirements before implementation
- Explicit specifications and plans
- Sound architecture and appropriate abstraction
- Maintainable code
- Testing and validation
- Code review
- Incremental development
- Meaningful Git history
- Continuous architectural awareness
- Developer judgment at every important step

AI increases development speed **without** reducing engineering quality.

### Progress and history

Development progress should be **visible and traceable**:

- Each meaningful step should be representable as a commit when practical.
- Commit history should tell the story of what was planned, implemented, and validated — not hide it in large, opaque changes.
- **Commits represent progress; pull requests represent review boundaries.** Those boundaries are a developer decision, not a rigid one-to-one rule with every step.

Peer review granularity depends on size, risk, and collaboration needs — not on maximizing or minimizing PR count for its own sake.

---

## Evaluating Capabilities

When considering any capability — skill, rule, hook, or agent — I ask:

1. What problem does it solve?
2. Why is it valuable?
3. Does it align with this philosophy?
4. Does it fit how I actually work?
5. Is it necessary?
6. Can it be simplified?
7. Should I adopt it, modify it, or reject it?

A capability is not valuable simply because it exists. Likewise, a gap in my workflow is not automatically a problem — some capabilities are unnecessary for how I work.

The workflow document maps **which** capabilities support **which** phases. This document defines **why** those choices must stay aligned with developer control and engineering quality.

---

## Long-Term Objective

The target is not merely knowing how to use a coding agent or IDE feature.

The target is:

> **Understand how to design and operate an AI-assisted software-development system that combines strong software-engineering principles with AI capabilities to produce high-quality software more effectively.**

Over time, I aim to:

- Design and refine AI development workflows grounded in practice
- Create and maintain effective skills
- Evaluate AI-generated work critically
- Control agents without surrendering judgment
- Understand the tradeoffs of AI-assisted development
- Continuously improve the process from evidence

This system is a **living engineering practice**, not a static collection of configuration files.
