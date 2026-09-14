# Kith & Kin — Family Tree Builder Web App

A full-featured, modern, and production-ready **Family Tree Builder** web application built with React, Vite, Supabase (Auth, PostgreSQL, Storage, Row Level Security), React Flow (`@xyflow/react`), and Lucide React.

---

## Features

- **Interactive Generational Canvas**: Smooth pan, zoom, fit to view, and mini-map powered by `@xyflow/react`.
- **Automatic Hierarchical Layout**: Automatically arranges ancestors, spouses beside each other, and children below parent couples without node overlaps.
- **Rich Person Records**: Track portrait photos, full names, gender, birth & death dates, birthplace, and biographical notes.
- **Flexible Real-World Relationships**: Supports single parents, multiple marriages, and blended lineages.
- **Client-Side Photo Compression**: Resizes and compresses images using HTML5 Canvas before uploading to Supabase Storage, preserving performance and bandwidth.
- **Instant Search & Node Centering**: Search across all ancestors by name; clicking an ancestor smoothly centers the canvas with a highlight animation.
- **Family Sharing & RLS**: Grant collaborators **Owner**, **Editor**, or **Viewer** access backed by PostgreSQL Row Level Security (RLS) policies.
- **Instant Demo Family**: Includes an optional 3-generation sample family tree ("The Harrison Family") to test layout, relationships, and navigation in one click.
- **Local Fallback Mode**: If Supabase environment variables are not yet configured, the app runs smoothly in a local development mode so all features can be tested immediately.

---

## Tech Stack

- **Frontend**: React 19, Vite, JavaScript (JSX)
- **Canvas / Flow**: `@xyflow/react`
- **Routing**: `react-router-dom`
- **Icons**: `lucide-react`
- **Backend / Database / Storage**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Styling**: Vanilla CSS Design System with warm genealogy aesthetics

---

## Getting Started

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase_schema.sql` from this repository, copy its entire contents, paste it into the Supabase SQL editor, and click **Run**.
   - This sets up all tables (`profiles`, `families`, `family_collaborators`, `people`, `family_members`, `relationships`), constraints, Row Level Security (RLS) policies, triggers, and the `family-photos` storage bucket.

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Add your Supabase project URL and anon public key (found in **Project Settings > API**):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Note: If you run without `.env`, the app automatically enables the local demo simulator so you can test all features offline!)*

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Database Schema Overview

- **`profiles`**: Public profile data synchronized automatically with `auth.users`.
- **`families`**: Family tree containers created and owned by users.
- **`family_collaborators`**: Multi-user sharing permissions (`owner`, `editor`, `viewer`).
- **`people`**: Member profile records (name, gender, birth/death dates, birthplace, notes, portrait URL).
- **`family_members`**: Junction table tracking person membership in families.
- **`relationships`**: Directed parent-child and spousal links with database constraints:
  - `person_1_id <> person_2_id` (prevents self-relationships)
  - `UNIQUE(family_id, person_1_id, person_2_id, relationship_type)` (prevents duplicate links)

---

## Building for Production

```bash
npm run build
npm run preview
```
