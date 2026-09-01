---
name: game-design
description: Behavioral and motivational design principles for video games and immersive entertainment.
---

# Video Game Behavioral Architecture

Video games are pure Human-Focused Design: players have no external obligation to play and will churn instantly if engagement fails.

---

## Core Principles for Game Systems

### 1. The Core Gameplay Loop
The fundamental 5-second to 30-second interaction cycle that defines gameplay.

[Player Decision] ──► [Action Execution] ──► [System Feedback]
▲                                           │
└─────────── [State Update] ◄───────────────┘

- Must be intrinsically satisfying through immediate responsiveness, clear visual/audio feedback, and strategic depth.

### 2. Balancing Challenge & Skill (Flow State)
Maintain engagement between the boundaries of Anxiety and Boredom.
- **Too Hard:** High anxiety → User churns (CD8 overload).
- **Too Easy:** High boredom → User churns (CD2/CD3 collapse).
- **Dynamic Difficulty:** Adjust enemy behavior, resource availability, or challenge parameters dynamically based on player performance metrics.

---

## Player Archetype Mapping (Bartle + Octalysis)

| Archetype | Primary Focus | Core Drives | Preferred Mechanics |
|---|---|---|---|
| **Achievers** | Overcoming challenges, 100% completion | CD2, CD4 | Badges, trophies, leaderboards, hard boss fights |
| **Explorers** | Discovering mechanics, lore, secrets | CD7, CD3 | Easter eggs, open worlds, narrative branches |
| **Socializers** | Building relationships, collaboration | CD5, CD1 | Guilds, co-op quests, chat systems, gifting |
| **Killers/Competitors** | Dominating others, proving supremacy | CD5, CD2, CD6 | PvP arenas, exclusive ranks, ranked ladders |

---

## Game-Specific Anti-Patterns

- **Skinner Box Without Meaning:** Random rewards (CD7) without player agency or strategy (CD3) creates compulsive but resentful play.
- **Pay-to-Win Erosion:** Monetizing CD6 (Scarcity) or CD2 (Accomplishment) through purchasable power destroys earned mastery and drives churn.
- **Content Treadmill:** Relying on finite content patches rather than evergreen mechanics (CD3/CD5) for retention.
