# Release Database Setup

This app saves data in Supabase. For a released Windows or Android build, you need one active Supabase cloud project. The app will not save shared data if the project URL in `.env` points to a deleted or inactive project.

## 1. Create the Supabase project

1. Open Supabase and create a new project.
2. Go to Project Settings > API.
3. Copy the project ref, project URL, and anon public key.
4. Create `.env` from `.env.example`:

```env
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
```

Do not put the service role key in the app.

## 2. Push the database schema

Run these commands from the project folder:

```powershell
npm.cmd run db:login
npm.cmd run db:link -- --project-ref your-project-ref
npm.cmd run db:push
```

The migrations create the release tables and storage used by the app:

- profiles
- user_roles
- classes
- class_enrollments
- attendance_sessions
- attendance_records
- timetables
- announcements
- holidays
- timetables storage bucket
- leave-proofs storage bucket

## 3. Rebuild after changing `.env`

The Supabase URL and key are compiled into the web, Windows, and Android builds. After updating `.env`, rebuild:

```powershell
npm.cmd run build
npx.cmd cap copy android
npx.cmd cap copy electron
```

Then rebuild the app packages if you are releasing new installers/APKs.
