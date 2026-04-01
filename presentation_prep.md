# E-Kost — Final Presentation Prep

> Bootcamp final presentation. ~15 minutes total.
> Legend: **[CODEBASE]** = verified from project files | **[PERSONAL]** = from your answers

---

## 1. Idea Recap (~2 min)

### The Problem — Two Real Cases from My Life

**Case A — My Dad (Building Owner)**
- Manages multiple rental rooms, relies on an on-site employee
- All events documented in a **physical logbook**
- Monthly meetings are the _only_ moment he gets visibility
- By the time he learns about problems (unpaid rent, maintenance), they've already escalated
- **Core pain:** the gap between event and awareness is too large

**Case B — My Landlord (Rental Manager)**
- Manages rooms with his daughter using a **large Excel spreadsheet**
- The spreadsheet works for those who built it, but his wife can't read it independently
- Creates dependency, frustration, and uneven access to information
- **Core pain:** information exists but isn't usable by everyone

[📸 SCREENSHOT: Side-by-side — physical logbook vs. Excel spreadsheet (or visual metaphor)]

### The Shared Insight

> The problem isn't the absence of information — it's the **gap between information existing and information being usable**.

### The Solution — E-Kost

- **Mobile-first web app** for small landlords to manage rooms, tenants, payments, and balances
- Named after the Indonesian word "kost" (rental rooms) — inspired by real property management challenges
- **One shared digital view** that replaces scattered logbooks, spreadsheets, and verbal recaps

**10 MVP Features:** Auth, Multi-property, Rooms, Tenants, Payments, Balances, Dashboard, Finance/Expenses, Notes, Settings **[CODEBASE]**

**Tech highlights:** Next.js + React, PostgreSQL (Supabase), Prisma, Better Auth, Tailwind/shadcn, i18n (English + Indonesian), $0/month hosting **[CODEBASE]**

[📸 SCREENSHOT: E-Kost dashboard on mobile viewport]

---

## 2. Most Critical Hypothesis & Outcome (~2 min)

### Framework: Lean Assumptions Mapping

Used **Assumptions Mapping** (Criticality vs. Certainty) to prioritize what to test first. All six hypotheses landed in the **EVALUATE** quadrant (high criticality, high uncertainty). **[PERSONAL]**

### The Six Hypotheses

| # | Type | Hypothesis |
|---|------|-----------|
| 1 | Desirability | Owners value tools that prevent missed payments, forgotten obligations, and tracking errors — these mistakes cost time, money, and credibility |
| 2 | Desirability | Faster issue resolution is highly valuable — improves tenant satisfaction, retention, reduces vacancy costs |
| 3 | Desirability | Owners want a single, centralized source of truth — fragmented coordination (email, chats, spreadsheets) causes confusion and stress |
| 4 | Feasibility | The app can be usable by non-technical users through intuitive design and simple workflows |
| 5 | Viability | Owners will pay (subscription/transaction fee) for a solution that reduces missed payments and admin effort |
| 6 | Viability | Most small landlords aren't using comprehensive property management software — room for an accessible alternative |

### What I Tested & How

- **Validated (Cards 1, 3, 4):** Informal interviews with my dad (Case A) and my landlord (Case B) — both confirmed the pain points are real. At least two people in this world approve. **[PERSONAL]**
- **Not yet validated (Cards 5, 6):** Willingness to pay and market gap — viability hypotheses remain unproven. Would need broader user testing and market research. **[PERSONAL]**

### Slide Talking Point

> "I validated that the _problem_ is real. I haven't yet validated that people will _pay_ for the solution. That's the next experiment."

[📸 SCREENSHOT: Your Assumptions Map (the 2x2 grid with sticky notes)]

---

## 3. Journey: Prototype → MVP → Final Product (~4–5 min)

### Timeline Overview

| Phase | Tool | Period | What Happened |
|-------|------|--------|---------------|
| Prototype | **Lovable** | Before Feb 2 | AI-generated prototype — first contact with a coding agent |
| Specs | **Kiro (AWS)** | Feb 2–24 | Initial specs, requirements, architecture decisions |
| Skeleton | **Cursor** | Feb 24 – Mar 15 | Workflow solidification, project foundation, first features |
| Implementation | **Claude Code** | Mar 15 – Apr 1 | Full feature implementation, enhancements, 9 custom skills |

**297 commits** over ~2 months. **[CODEBASE]**

[📸 SCREENSHOT: Lovable prototype (the first version)]

### Phase 1: Prototype (Lovable)

- First real experience with an AI coding agent (previously only knew chat interfaces) **[PERSONAL]**
- Generated a working prototype from descriptions — "mind-blowing" first impression
- Reaction: _"This is the reason why I'm unemployed"_ **[PERSONAL]**
- Prototype served as proof-of-concept, then was set aside for a proper build

[📸 SCREENSHOT: Lovable prototype UI — key screens]

### Phase 2: Specs & Architecture (Kiro)

- Wrote initial feature specifications and requirements **[CODEBASE: specs/ directory, commits from Feb 2–24]**
- Defined the 5-layer architecture (Domain → Service → API → Repository → UI) **[CODEBASE: specs/architecture-intent.md]**
- Made key technology decisions (Better Auth over Supabase Auth, Prisma, etc.) **[CODEBASE: specs/technology-decisions.md]**
- Feb 24: moved specs out of `.kiro` folder — transitioned to next tool **[CODEBASE: commit d31e70a]**

### Phase 3: Skeleton & Workflow (Cursor)

- Set up the actual Next.js project with full tooling **[CODEBASE: commit cda72b7, Mar 2]**
- Built foundation: Prisma schema, i18n, Vitest, mobile shell **[CODEBASE]**
- Implemented authentication (first feature, TDD) **[CODEBASE: commit 1edbe3c]**
- Created 5 Cursor skills for guided development **[CODEBASE: .cursor/skills/]**
- Set up Playwright MCP for E2E testing **[CODEBASE: commit from Mar 3]**

### Phase 4: Full Implementation (Claude Code)

- Implemented all remaining MVP features: multi-property, rooms, tenants, payments, balances, dashboard, finance, notes, settings **[CODEBASE: commits Mar 15 – Apr 1]**
- Built 9 custom skills, 5 rules, and a test-runner agent **[CODEBASE: .claude/]**
- Evolved from individual features to cross-cutting concerns (data freshness, responsive layout, currency management) **[CODEBASE]**
- This became the preferred tool — "the most comfortable AI tool so far" **[PERSONAL]**

[📸 SCREENSHOT: Final product — 2-3 key screens (dashboard, tenant detail, payment recording)]

### Slide Talking Point

> "Each tool taught me something different. Lovable showed me what's possible. Kiro taught me to think before coding. Cursor helped me set up the skeleton. Claude Code is where I actually built the product."

---

## 4. Key Learnings: Working with AI Tools (~3–4 min)

### Learning 1: Coding Agents Are Shockingly Powerful

- Before this bootcamp, didn't know coding agents existed — only knew the chat interface **[PERSONAL]**
- Lovable generated a working prototype from descriptions alone
- Claude Code implemented entire features layer-by-layer, following TDD, with minimal manual coding

[📸 SCREENSHOT: Example of a complex feature implemented via AI (e.g., git log showing a burst of commits for one feature)]

### Learning 2: But They Can Be Really Dumb — You Need a Harness

- Without guardrails, AI agents make poor decisions: skip tests, break architecture, commit prematurely **[PERSONAL]**
- Solution: built an extensive **control system** (the "harness"):

| Control | What It Does | Count |
|---------|-------------|-------|
| **Skills** | Automate specific workflows (test writing, API routes, commits) | 9 skills |
| **Rules** | Enforce standards (TDD, coding conventions, commit discipline) | 5 rules |
| **Agents** | Background workers (test runner) | 1 agent |
| **Specs** | Feature requirements, designs, task breakdowns | 30+ spec files |

**[CODEBASE: .claude/skills/ (9), .claude/rules/ (5), .claude/agents/ (1), specs/ (90+ files)]**

Key guardrails:
- **Never commit without explicit approval** — AI proposes, human decides **[CODEBASE: .claude/rules/commit-workflow.md]**
- **Tests are source of truth** — never weaken tests to make implementation pass **[CODEBASE: .claude/rules/testing.md]**
- **Layer-by-layer implementation** — AI follows the 5-layer architecture, pausing at each boundary **[CODEBASE: .claude/skills/implement/SKILL.md]**
- **3-stage test validation** before any implementation begins **[CODEBASE: .claude/rules/test-quality-gates.md]**

### Learning 3: The Human Still Decides

> "AI is a force multiplier — like a gun. Sure, it's powerful. But the one who wins the duel is the one with better understanding of the tool, better fundamentals, and better perception of the problem they're solving." **[PERSONAL]**

- The specs, architecture decisions, and hypothesis validation — all human work
- AI executed, but the _direction_ came from understanding the domain (my dad's logbook, my landlord's spreadsheet)

[📸 SCREENSHOT: CLAUDE.md or a skill file — showing the harness in action]

---

## 5. AI Features & Workflow (~2–4 min)

### No AI Features in the Product (By Design)

- The target users (small landlords, non-technical) don't need AI features right now **[PERSONAL]**
- Adding AI would be overhead without clear user value — YAGNI principle
- Architecture is **designed for future AI** (pluggable interfaces: IBalanceCalculator, IValidationService) — but not implemented yet **[CODEBASE: specs/architecture-intent.md]**

### How AI Built the Product — The Development Workflow

**The Pipeline (Issue → Production Code):**

```
GitHub Issue
    → /implement skill reads & clarifies gaps
        → Specs derived (requirements.md → design.md → tasks.md)
            → /test-author writes unit/integration tests (TDD)
            → /e2e-test-author writes Playwright browser tests
                → /test-validator runs 3 quality gates
                    → /layer-mapper scouts existing code
                        → Implementation: Domain → Service → API → UI → i18n
                            → /commit runs lint + tests, proposes message
                                → Human approves → push
```

**[CODEBASE: .claude/skills/implement/SKILL.md]**

### Concrete Examples of AI-Assisted Workflow

| Skill | What It Automates | Human Role |
|-------|-------------------|------------|
| `/implement` | Full issue-to-commit pipeline | Approve specs, review code, approve commits |
| `/test-author` | Writes Vitest tests (Good/Bad/Edge structure) | Review test quality, validate coverage |
| `/e2e-test-author` | Writes Playwright E2E tests (mobile viewport, real DB) | Review user flow accuracy |
| `/test-validator` | 3-gate quality check (structural, fault injection, review) | Review gate results |
| `/layer-mapper` | Scans all 5 layers for existing code | Decide what to reuse vs. build |
| `/commit` | Runs quality gates, stages files, proposes message | Explicit yes/no to commit and push |
| `/fix-tests` | Diagnoses failing tests, fixes production code | Review the fix |

### Evolution: Cursor → Claude Code

| Dimension | Cursor (Phase 3) | Claude Code (Phase 4) |
|-----------|-------------------|----------------------|
| Skills | 5 (atomic tasks) | 9 (orchestration + diagnostics) |
| Master orchestrator | None | `/implement` (full pipeline) |
| Commit safety | Manual | `/commit` (gates + approval) |
| Test diagnostics | None | `/fix-tests` |
| Codebase scouting | None | `/layer-mapper` |

**[CODEBASE: .cursor/skills/ vs .claude/skills/]**

### Slide Talking Point

> "I didn't use AI in the product — I used AI to _build_ the product. The key was treating AI like a junior developer: powerful but needs clear instructions, guardrails, and someone checking the work."

---

## 6. Vision & Next Steps (~1–2 min)

### Where E-Kost Is Today

- **10 features** fully implemented, tested, deployed **[CODEBASE]**
- **297 commits**, full TDD, bilingual (EN + ID) **[CODEBASE]**
- **$0/month** running cost (Vercel + Supabase free tiers) **[CODEBASE: specs/scalability-stress-analysis.md]**
- Handles 1,000+ tenants, 500+ rooms, 10,000+ payments **[CODEBASE]**

### Next Steps (If I Had More Time)

1. **Issue Tracking** — like GitHub Issues, but for property problems. Collaborative tool for owners + staff to track maintenance, complaints, follow-ups **[PERSONAL]**
2. **Map Markers** — visualize properties on a map for owners managing rooms across different locations **[PERSONAL]**
3. **Export to XLSX/CSV** — let owners generate reports they can print or share with accountants **[PERSONAL]**

### Commercial Vision

- **Closed testing first** — offer to relatives and people I know personally, not a public launch **[PERSONAL]**
- Validate with real daily usage before scaling
- Goal: evolve from portfolio project into a real product

### Question for the Audience

> "How would you approach marketing and scaling a niche product like this — targeted at small landlords who currently use logbooks and spreadsheets?"

[📸 SCREENSHOT: Simple roadmap visual or feature wishlist]

---

## Appendix: Quick Reference for Q&A

| Topic | Answer |
|-------|--------|
| **Tech stack** | Next.js, React, Prisma, PostgreSQL (Supabase), Better Auth, Tailwind, shadcn/ui |
| **Cost** | $0/month (Vercel + Supabase free tiers) |
| **Timeline** | ~2 months (Feb 2 – Apr 1, 2026), 297 commits |
| **Testing** | TDD with Vitest (unit/integration) + Playwright (E2E), 3 quality gates |
| **i18n** | English + Indonesian, JSON-based, currency per locale |
| **Architecture** | 5-layer (Domain → Service → API → Repository → UI) |
| **AI tools used** | Lovable (prototype), Kiro (specs), Cursor (skeleton), Claude Code (implementation) |
| **Why no AI in product?** | Users don't need it yet; architecture supports future AI via pluggable interfaces |
| **Why mobile-first?** | Target users (small landlords in developing markets) primarily use smartphones |
| **Why Better Auth?** | Self-hostable, no vendor dependency, data lives in same DB as domain data |
