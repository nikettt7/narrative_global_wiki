# Bhaarat Wiki
### Official Character Compendium for *The Age of Bhaarat* by Tara Gaming

A closed wiki built with **Next.js + Supabase**, deployable to **Vercel** in minutes.

---

## Stack

| Layer    | Technology       |
|----------|-----------------|
| Frontend | Next.js 14      |
| Database | Supabase (PostgreSQL) |
| Auth     | Supabase Auth   |
| Hosting  | Vercel          |

---

## ⚡ Quick Deploy (Step by Step)

### Step 1 — Set up Supabase

1. Go to **[supabase.com](https://supabase.com)** → "Start your project" → Sign up free
2. Click **"New Project"** → give it a name (e.g. `bhaarat-wiki`) → set a database password → Create
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** (left sidebar) → click **"New Query"**
5. Copy the entire contents of `sql/schema.sql` → paste it → click **"Run"**
6. Go to **Settings → API** (left sidebar)
7. Copy these two values — you'll need them soon:
   - **Project URL** (looks like: `https://xxxx.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

### Step 2 — Push code to GitHub

1. Go to **[github.com](https://github.com)** → "New repository"
2. Name it `bhaarat-wiki` → Create repository
3. On your computer, open a terminal in this project folder and run:
```bash
git init
git add .
git commit -m "Initial Bhaarat Wiki"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bhaarat-wiki.git
git push -u origin main
```

### Step 3 — Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** → "Add New Project"
2. Click **"Import Git Repository"** → select your `bhaarat-wiki` repo
3. Before clicking Deploy, click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = (your Project URL from Step 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = (your anon key from Step 1)
   ```
4. Click **Deploy** → done! Vercel gives you a live URL instantly.

---

## 🔐 Setting Up Your Admin Account

1. Visit your live Vercel URL
2. Click **"Enter"** → **"Create Account"** tab → sign up as **Editor**
3. Check your email and confirm your account
4. Go to your Supabase dashboard → **SQL Editor** → run this (replace with your email):
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your@email.com');
```
5. Sign in — you now have full admin/editor access.

---

## 👥 User Roles

| Role   | Can Do                                              |
|--------|-----------------------------------------------------|
| Reader | Browse all characters and read all wiki content     |
| Editor | Create characters, edit all sections and infoboxes  |
| Admin  | Everything above + elevated permissions             |

To promote someone to Editor, run in Supabase SQL Editor:
```sql
update public.profiles set role = 'editor'
where id = (select id from auth.users where email = 'their@email.com');
```

---

## 📁 Project Structure

```
bhaarat-wiki/
├── components/
│   ├── AuthModal.jsx      ← Sign in / sign up modal
│   ├── Header.jsx         ← Top navigation bar
│   ├── Sidebar.jsx        ← Character list + add new
│   ├── Infobox.jsx        ← Character info panel
│   ├── WikiSection.jsx    ← Individual editable section
│   └── Toast.jsx          ← Save notifications
├── lib/
│   ├── supabase.js        ← Database client + all queries
│   └── authContext.js     ← Auth state provider
├── pages/
│   ├── _app.jsx           ← App wrapper
│   ├── index.jsx          ← Home page (character grid)
│   └── character/[id].jsx ← Individual character page
├── styles/
│   └── globals.css        ← Full design system
├── sql/
│   └── schema.sql         ← Run this in Supabase once
└── .env.local.example     ← Copy to .env.local with your keys
```

---

## 🛠 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## Each Character Has

- **Infobox** with 5 categories: Biographical · Physical · Relationships · Magical Characteristics · Affiliation
- **Introduction paragraph**
- **Table of Contents** (auto-generated)
- **7 Sections**: Biography · Physical Description · Personality · Abilities & Skills · Relationships · Etymology · Appearances

---

## Future Additions (ask Claude!)

- Character image uploads (via Supabase Storage)
- Cross-linking between characters
- Change history / revision log
- Search with filters by faction, species, allegiance
- Admin dashboard to manage users
