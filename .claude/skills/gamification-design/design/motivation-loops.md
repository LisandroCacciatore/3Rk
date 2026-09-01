---
name: motivation-loops
description: Formulate and validate micro and macro motivation loops for user engagement.
---

# Motivation Loops Architecture

Every repeatable behavior in the system must be governed by an explicit loop. Never design isolated mechanics without an enclosing loop.

## Standard Loop Structure

[TRIGGER] ──► [ACTION] ──► [FEEDBACK]
    ▲                           │
    │                           ▼
[NEW GOAL] ◄── [PROGRESS] ◄── [REWARD]

---

## Loop Definition Specification

For each primary feature, document:

1. **Trigger (Internal / External):**
   - *Internal:* Emotion, habit, need (e.g., "I feel inconsistent in my training").
   - *External:* Push notification, UI indicator, team mention.

2. **Action (User Effort):**
   - The minimal single behavioral unit requested. Must match cognitive/physical capacity.

3. **Feedback (Instantaneous Response):**
   - Visual, audio, or tactile response acknowledging the action instantly.

4. **Reward (Intrinsic or Extrinsic):**
   - *Left Brain:* Utility, points, resource gain, unlock.
   - *Right Brain:* Insight, social recognition, discovery, self-expression.

5. **Progress (System Change):**
   - Update to profile, history, skill level, rank, or streak.

6. **New Goal (Next Trigger Anchor):**
   - Immediate prompt or milestone setup for the next session.

---

## Validation Checklist

- [ ] Does the loop rely solely on cheap dopamine (CD7/CD2) or does it build mastery (CD3/CD2)?
- [ ] What happens when the reward is removed? Does the action collapse?
- [ ] Is feedback immediate (<200ms for UI, real-time for performance data)?
- [ ] Does the loop transition from external triggers to internal triggers over time?
