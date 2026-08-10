# Authentication and Roles

Authentication is handled by Supabase Auth (`src/features/auth/actions.ts`,
`src/app/auth/`).

Authentication methods actually implemented:

```txt
Email and password (signUp / signIn)
Google OAuth (signInWithGoogle, via supabase.auth.signInWithOAuth)
Password reset (requestPasswordReset / updatePassword)
```

Not implemented (do not assume these exist):

```txt
Magic link sign-in (no signInWithOtp call anywhere in the code)
Apple OAuth
A real "parent-managed student login" flow — a parent signup only stashes a
  student_email string in user_metadata for future linking; the actual parent↔student
  connection is done later via link_student_by_email (see below), which links to an
  ALREADY-registered student profile rather than creating one.
```

Roles — there are **four**, not three (`user_role` enum: `student, parent, admin,
teacher`). The enum's `child` value was renamed to `student`; `teacher` was added
later as a genuinely new role, not a rename.

```txt
student
parent
teacher
admin
```

Teachers are promotion-only from the Manage Teachers screen: an admin resolves an
existing account (by username or email, any role except admin/teacher) and calls the
`promote_teacher()` RPC to flip its role to `teacher` (`revoke_teacher()` reverses it
back to `parent` and deletes the teacher's groups).

The Manage Users screen (`/admin/users`) is the general case of the same idea, and
adds account creation and deletion:

* `admin_list_users()` lists every account with the email only `auth.users` knows.
* `admin_set_user_role()` moves any account between the four roles. It deletes a
  departing teacher's groups (like `revoke_teacher()`) and drops a departing admin's
  `admin_emails` row — otherwise `claim_admin()` would restore the role at their next
  login. It refuses to change the caller's own role, so an admin can't lock themselves
  out of the console.
* `admin_delete_user()` deletes the `auth.users` row itself; every user-owned table
  cascades off it. It also refuses self-deletion.
* Creating an account still does **not** use `supabase.auth.admin.createUser()` —
  there is no service-role key. `createUser` (src/features/admin/userActions.ts)
  registers the account through the ordinary `auth.signUp` API on a standalone client
  with `persistSession: false` (so the admin's own session is untouched), then calls
  `admin_create_profile()` for the profile and `user_stats` rows. Consequence: if the
  Supabase project requires email confirmation, the new account must confirm before
  its first sign-in — the console says so after creating one.

Student permissions:

```txt
View city map
Complete missions
Earn XP and coins
Maintain streak
Customize Slay (equip one wardrobe item at a time)
View own progress
Switch knowledge level (once another level has published content) and restart a
  cleared level
Complete teacher-assigned homework (vocabulary/grammar topics), if in a teacher_group
Submit bug/feedback reports
```

Parent permissions:

```txt
Link to a student profile by email (link_student_by_email RPC)
View student progress
View completed missions
View learned vocabulary
View streaks and study time
View map progress
View student's homework summary
```

Teacher permissions:

```txt
View and manage groups of students (teacher_groups / teacher_group_members)
Create/edit/delete homework topics for a group
Draft homework vocabulary/grammar content via AI, then publish or clear it
Participate in the per-topic Q&A thread with their group's students
Preview the full map/mission content in a read-only review mode
Move a location's label on the map (set_location_map_position)
Submit bug/feedback reports
```

Admin permissions:

```txt
Create/update/delete/publish/unpublish districts, locations, missions, mission tasks
Manage task-type templates
Create, update, publish/unpublish, delete wardrobe items
Generate AI art (location icons, map backgrounds, task images) via OpenRouter
Manage the admin_emails allowlist
Promote/revoke teachers; create/delete teacher groups; add/remove group members
View and manage the feedback inbox
```

Authorization rules:

* Student users can access only their own profile and progress.
* Parent users can access only linked student profiles.
* Teacher users can access only their own groups' students (`teaches_student()` RLS
  helper), and only in read/homework-management form — not raw progress mutation.
* Admin users can manage content and system data, and can impersonate a specific
  teacher ("view as teacher") via a cookie-gated session for support purposes; writes
  made while impersonating are attributed to the impersonated teacher.
* All sensitive access must be protected by Row Level Security.
* Role checks must be enforced on both `src/middleware.ts` (routes: admin→`/admin*`,
  parent→`/parent*`, teacher→`/teacher*`, student blocked from both `/parent*` and
  `/teacher*`) and backend functions/guards (`requireAdmin`, `requireTeacher`,
  `requireParentPage`, plus RLS).
