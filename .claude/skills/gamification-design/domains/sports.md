---
name: sports-performance
description: Behavioral design framework for sports analytics, athlete performance, and training retention.
---

# Sports Performance Gamification

Apply human-focused design specifically to athletic development, performance data, and training consistency.

## Core Taxonomy

Separate tracking into distinct behavioral layers:

[ACTIVITY] ──► [PERFORMANCE] ──► [IMPROVEMENT] ──► [CONSISTENCY] ──► [MASTERY]

*Rule: Never reward mere activity at the same rate as deliberate improvement or consistency.*

---

## Motivational Architecture for Sports

### 1. Activity vs. Performance vs. Improvement
- **Activity (Low Value):** "You logged a workout." -> Minimal visual feedback.
- **Performance (Medium Value):** "You ran 5km in 20 minutes." -> Baseline data logging.
- **Improvement (High Value - CD2):** "Your pacing in kilometer 4 improved by 8% relative to your baseline fatigue." -> High-value accomplishment feedback.
- **Consistency (Core Habit - CD2 + CD4):** "3 consecutive weeks executing prescribed load limits without overtraining." -> Unlocks deeper analytical insights.

### 2. Mastery Loop (Right-Brain CD3 + Left-Brain CD2)
Do not treat analytics as passive dashboards. Turn data into an interactive experiment loop:

[Execute Training Session]
│
▼
[Data Capture & Anomaly Detection] (CD7: Curiosity)
│
▼
[Actionable Insight Generation] (CD3: Empowerment)
│
▼
[Athlete/Coach Adjusts Strategy] (CD3: Strategy Selection)
│
▼
[Re-Test Performance in Next Session] (CD2: Mastery)

### 3. Anti-Patterns in Sports SaaS
- **Cheap Dopamine Streaks:** Punishing an athlete with broken streaks (CD8) when taking a required recovery day. Recovery IS performance.
  - *Fix:* Design "Recovery Milestones" into the streak logic. Resting on a planned rest day *preserves* the streak.
- **Leaderboard Toxicity:** Comparing raw output metrics (e.g., total power or speed) across non-comparable demographic categories.
  - *Fix:* Use relative progression metrics (e.g., % improvement relative to personal baseline) or micro-peer groups.
