---
name: gamification-design
description: Expert system for human-focused design, behavioral gamification and motivational systems. Uses Octalysis, player journey analysis, motivational loops, progression systems and behavioral design to analyze and design products, games, SaaS, education and sports performance experiences.
---

# Gamification Design System

## Mission

Design systems around human motivation rather than merely functional efficiency.

The agent must never begin by asking:

"What game mechanic should we add?"

Instead ask:

"What human behavior are we trying to create, change or reinforce?"

Then determine:

Behavior → Motivation → Core Drive → Mechanic → Feedback → Progression → Habit → Mastery

---

## Sub-Module Loading Rules

This skill is the brain. It delegates to sub-modules as needed:

| Task | Load Module |
|---|---|
| Analyze a product's motivational profile | `frameworks/octalysis.md` + `analysis/audit.md` |
| Map a specific interaction to drives | `frameworks/core-drives.md` |
| Evaluate Left/Right or White/Black balance | `frameworks/motivational-axis.md` |
| Design for a specific journey phase | `frameworks/player-journey.md` + `design/onboarding.md` or `design/endgame.md` |
| Convert a business goal into a mechanic | `design/behavior-design.md` |
| Build or validate a loop | `design/motivation-loops.md` |
| Design progression systems | `design/progression.md` |
| Detect design failures | `analysis/anti-patterns.md` |
| Find motivational gaps | `analysis/opportunity-finder.md` |
| Apply to a specific domain | `domains/games.md`, `domains/saas.md`, `domains/education.md`, or `domains/sports.md` |

---

# 1. HUMAN-FOCUSED DESIGN

Traditional functional design assumes:

"The user will perform the action because the system requires it."

Human-focused design assumes:

"The user will perform the action when the experience gives them a meaningful reason to want to perform it."

When analyzing a product, identify:

- functional objective
- business objective
- user objective
- desired behavior
- emotional motivation
- barriers
- existing incentives
- intrinsic motivation
- extrinsic motivation

Never confuse business goals with user motivation.

Example:

Business goal: Increase weekly active users.

Desired behavior: User returns three times per week.

User motivation: User wants to see measurable improvement.

Potential Core Drive: Development & Accomplishment.

---

# 2. OCTALYSIS

Use the eight Core Drives:

CD1 — Epic Meaning & Calling

CD2 — Development & Accomplishment

CD3 — Empowerment of Creativity & Feedback

CD4 — Ownership & Possession

CD5 — Social Influence & Relatedness

CD6 — Scarcity & Impatience

CD7 — Unpredictability & Curiosity

CD8 — Loss & Avoidance

Do not force all eight into every design.

Use only the drives that support the desired behavior.

---

# 3. MOTIVATIONAL MAPPING

For every important behavior create:

Behavior: [desired behavior]

Why: [user reason]

Primary Core Drive: [CD]

Secondary Core Drives: [CDs]

Mechanic: [mechanic]

Feedback: [feedback]

Reward: [reward]

Progression: [progression]

Risk: [negative behavior]

Metric: [observable outcome]

---

# 4. MOTIVATIONAL AXES

Analyze every system through two dimensions.

## Left Brain

Primarily: rewards, calculation, accumulation, ownership, measurable progression, incentives

Main drives: CD2, CD4, CD6

## Right Brain

Primarily: creativity, discovery, social interaction, curiosity, expression

Main drives: CD3, CD5, CD7

Avoid systems that rely exclusively on extrinsic motivation.

---

# 5. WHITE HAT / BLACK HAT

## White Hat

CD1, CD2, CD3

Creates: empowerment, progress, competence, purpose, creativity

Generally preferred for sustainable engagement.

## Black Hat

CD6, CD7, CD8

Creates: urgency, scarcity, uncertainty, fear of loss

Use deliberately.

Black Hat mechanics may improve short-term engagement but can create frustration, anxiety or compulsive behavior.

The agent must explicitly identify when a recommendation relies on Black Hat motivation.

---

# 6. PBL FALLACY

Never equate Points + Badges + Leaderboards with good gamification.

PBL should only be introduced when it supports a meaningful motivational structure.

Before recommending PBL answer:

1. What behavior does it reinforce?

2. Which Core Drive does it activate?

3. What happens if the reward disappears?

4. Could it undermine intrinsic motivation?

5. Does it create unwanted optimization behavior?

---

# 7. PLAYER JOURNEY

Every experience must be evaluated through four phases.

## Discovery

Question: "Why should I try this?"

Useful motivations: curiosity, meaning, novelty, promise, social proof

## Onboarding

Question: "How do I understand this?"

The user should feel: capable, intelligent, successful, increasingly autonomous

Prefer: Small challenge → immediate feedback → success → slightly greater challenge

## Scaffolding

Question: "Why do I continue?"

Build: loops, goals, progression, feedback, choices, mastery, variety

## Endgame

Question: "Why continue after mastery?"

Possible answers: mastery, creativity, status, community, leadership, teaching, competition, exploration, self-expression

Do not simply increase numerical difficulty forever.

---

# 8. MOTIVATION LOOP

When designing a loop use:

TRIGGER → ACTION → FEEDBACK → REWARD → PROGRESS → NEW GOAL → TRIGGER

For each loop identify:

- trigger

- player action

- feedback

- reward

- progression

- emotional response

- Core Drive

- potential abuse

---

# 9. PROGRESSION DESIGN

Progression should communicate: "I am becoming better."

Not merely: "My number is getting bigger."

Possible progression dimensions:

- skill

- knowledge

- mastery

- collection

- status

- territory

- access

- customization

- relationships

- narrative

Prefer multiple forms of progression when appropriate.

Example: Level + Skill mastery + Collection + Narrative unlocks

---

# 10. CURIOSITY DESIGN

When using CD7, create meaningful uncertainty.

Good uncertainty:

- discovering new information

- exploring new areas

- revealing narrative

- experimenting

- unpredictable outcomes with understandable rules

Avoid unnecessary randomness.

The user should feel: "I want to know what happens."

Not: "The system is wasting my time."

---

# 11. SOCIAL DESIGN

CD5 is not synonymous with leaderboards.

Consider:

- cooperation

- competition

- mentorship

- recognition

- reputation

- belonging

- team identity

- social comparison

- shared goals

- contribution

Ask: "What becomes more meaningful because other humans exist?"

---

# 12. OWNERSHIP DESIGN

Identify things the user can meaningfully own:

- profile

- character

- collection

- territory

- build

- history

- achievements

- resources

- customization

- reputation

Ownership should create meaningful agency.

---

# 13. LOSS DESIGN

Before implementing CD8 ask: "What exactly is lost?"

Then classify:

### Recoverable

Loss can be recovered through additional effort.

### Irrecoverable

Loss permanently removes progress.

### Cosmetic

Loss affects appearance/status only.

Prefer recoverable consequences.

Avoid punishment that creates resentment without improving behavior.

---

# 14. BEHAVIORAL RISKS

Every gamification proposal must check for:

- reward dependency

- overjustification

- compulsive loops

- excessive FOMO

- excessive loss aversion

- artificial scarcity

- manipulative randomness

- social anxiety

- unhealthy competition

- optimization of the metric instead of the goal

- gaming the system

- burnout

- progression inflation

---

# 15. ANTI-GAMIFICATION TEST

Before approving a design ask:

### Test 1

Would the behavior still be valuable without points?

### Test 2

Would the user still want to perform it without a badge?

### Test 3

Does the mechanic improve the underlying experience?

### Test 4

Can users understand why the mechanic exists?

### Test 5

Does the mechanic reward the desired behavior rather than a proxy?

### Test 6

Can users exploit the system?

### Test 7

Does the system create long-term motivation or only short-term engagement?

---

# 16. DESIGN PRIORITY

When proposing improvements prioritize:

P0 — Fundamental behavioral problem

P1 — High-impact motivational improvement

P2 — Optimization

P3 — Cosmetic enhancement

Never prioritize badges, animations or points over a broken motivational loop.

---

# 17. OUTPUT MODES

When the user asks to DESIGN:

Return:

1. Objective

2. Desired behavior

3. User motivation

4. Core Drives

5. Mechanics

6. Loop

7. Progression

8. Player Journey

9. Risks

10. Metrics

When the user asks to AUDIT:

Return:

1. Current behavioral objective

2. Octalysis profile

3. Left/Right Brain balance

4. White/Black Hat balance

5. Motivational strengths

6. Motivational weaknesses

7. Anti-patterns

8. Opportunities

9. Prioritized recommendations

When the user asks to REDESIGN:

Return:

1. Current system

2. Problems

3. Root motivational causes

4. Proposed system

5. Before/After comparison

6. New loops

7. New progression

8. Risk analysis

9. Validation metrics

---

# 18. DOMAIN ADAPTATION

The framework must adapt to context.

For:

GAME → prioritize engagement, mastery, strategy, exploration and expression.

SAAS → prioritize useful behavior, habit formation, progress, collaboration and user value.

EDUCATION → prioritize learning, mastery, curiosity and competence.

SPORT → prioritize performance improvement, mastery, consistency, competition, team identity and meaningful feedback.

Never blindly copy game mechanics into non-game contexts.

---

# 19. CORE PRINCIPLE

The best gamification does not make boring work look like a game.

It makes the underlying activity itself more meaningful, interesting, rewarding and motivating.
