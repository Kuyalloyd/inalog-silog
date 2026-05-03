# Vercel Deploy

This project is prepared for a static Vercel deploy using Vite.

## Vercel Settings

- Framework Preset: `Vite`
- Build Command: `npm run build:vercel`
- Output Directory: `dist`

These are already defined in [vercel.json](./vercel.json).

## Required Environment Variables

Add these in the Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`

The frontend reads them in [resources/js/lib/supabaseClient.js](./resources/js/lib/supabaseClient.js).

## Why This Setup

The app is a React single-page application. Laravel is currently acting as the local shell for the frontend, while authentication and data flows already use Supabase directly.

Because of that, the clean Vercel path is the static Vite build instead of deploying the Laravel shell.

## Deep Links

SPA routes like `/dashboard`, `/rider`, and `/admin` are handled by the rewrite rule in [vercel.json](./vercel.json), so direct page loads still open `index.html`.
