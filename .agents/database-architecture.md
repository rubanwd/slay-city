# Database Architecture

The database should be built with PostgreSQL in Supabase.

Main tables:

```txt
profiles
districts
locations
missions
vocabulary_items
mission_tasks
user_progress
user_stats
wardrobe_items
user_wardrobe_items
achievements
user_achievements
ai_content_drafts
```

Table purposes:

```txt
profiles
Stores child profile data.

districts
Stores city districts.

locations
Stores map locations inside districts.

missions
Stores learning missions connected to locations.

vocabulary_items
Stores English words, translations, images, audio, and examples.

mission_tasks
Stores task steps such as vocabulary, matching, listening, and quizzes.

user_progress
Stores completed missions and unlocked progress.

user_stats
Stores XP, coins, level, current streak, and longest streak.

wardrobe_items
Stores available Slay accessories.

user_wardrobe_items
Stores purchased or unlocked accessories.

achievements
Stores achievement definitions.

user_achievements
Stores achievements unlocked by a user.

ai_content_drafts
Stores AI-generated content before review and publishing.
```

Database rules:

* Learning content must be stored in the database.
* User progress must be stored per child profile.
* Reward-related data must be updated only through backend functions.
* All user-related tables must be protected with Row Level Security.
* Admin content should support draft and published states.
