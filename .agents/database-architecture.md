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
admin_emails
parent_student_links
task_type_templates
```

Table purposes:

```txt
profiles
Stores student profile data.

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

admin_emails
Allowlist of email addresses permitted to self-claim the admin role (see claim_admin RPC).

parent_student_links
Links a parent account to one or more student profiles (see link_student_by_email RPC).

task_type_templates
Stores per-task-type default config used by the admin Task Types configurator/tester.
```

Database rules:

* Learning content must be stored in the database.
* User progress must be stored per student profile.
* Reward-related data must be updated only through backend functions.
* All user-related tables must be protected with Row Level Security.
* Admin content should support draft and published states.
