# Product Concepts

SLAY CITY is a gamified English-learning PWA for children aged 7–14.

The product turns daily English practice into an adventure inside a virtual city. The student explores Slay City together with Slay, a friendly snake mascot. Each completed mission restores part of the city, unlocks the next location, introduces new English vocabulary, and rewards the student with coins, XP, and visual progress.

The main product loop is:

```txt
Map → Mission → Reward → Unlock → Return Tomorrow
```

The MVP focuses on validating whether students are motivated to return daily, complete short English missions, and progress through the city.

The first version should include a limited number of districts and missions, enough to test the core engagement mechanic without building a full educational platform.

## Current implementation (beyond original MVP scope)

The product has grown two significant capabilities past the original MVP loop, both
still serving retention/parent-trust rather than replacing the core loop:

* **Knowledge levels** — districts and student profiles now carry a `knowledge_level`
  (beginner → elementary → pre_intermediate → intermediate → upper_intermediate). Only
  `elementary` has published content today; a student can only switch to or see a level
  once it has published content, and can restart a cleared level.
* **Teacher-assigned homework** — a fourth role, `teacher`, was added on top of
  student/parent/admin. Teachers (promoted from existing accounts by an admin, never
  created from scratch) own groups of students and author vocabulary/grammar homework
  topics with AI-assisted drafting, with a shared Q&A thread per topic. This runs
  alongside the map/mission loop, not instead of it.

See [Authentication and Roles](authentication-and-roles.md) and
[Database Architecture](database-architecture.md) for the mechanics.
