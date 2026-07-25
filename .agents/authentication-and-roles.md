# Authentication and Roles

Authentication should be handled by Supabase Auth.

Initial authentication methods:

```txt
Email and password
Magic link
```

Future authentication methods:

```txt
Google OAuth
Apple OAuth
Parent-managed student login
```

Roles:

```txt
student
parent
admin
```

Student permissions:

```txt
View city map
Complete missions
Earn XP and coins
Maintain streak
Customize Slay
View own progress
```

Parent permissions:

```txt
View student progress
View completed missions
View learned vocabulary
View streaks
View map progress
```

Admin permissions:

```txt
Create districts
Create locations
Create missions
Create vocabulary
Create mission tasks
Generate AI content
Review AI drafts
Publish and unpublish content
Manage rewards
Manage wardrobe items
```

Authorization rules:

* Student users can access only their own profile and progress.
* Parent users can access only linked student profiles.
* Admin users can manage content and system data.
* All sensitive access must be protected by Row Level Security.
* Role checks must be enforced on both frontend routes and backend functions.
