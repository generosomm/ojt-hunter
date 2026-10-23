# Phase 0 setup guide (dashboard clicks)

Do these in order. Dashboards change their menus sometimes; if a button name differs, look for the
closest match and tell Claude what you see. Never paste keys or secrets into chat.

## 1. GitHub: create the public repo
1. Go to https://github.com/new
2. Repository name: `ojt-hunter`. Visibility: **Public**.
3. Leave "Add a README", ".gitignore" and "license" **unticked** (we already have files).
4. Click **Create repository**. Keep the page open for step 6.
5. Optional, recommended for a public repo: GitHub > Settings > Emails > tick **Keep my email
   addresses private**, copy the `...@users.noreply.github.com` address. Then in the project folder:
   ```bash
   git config user.email "PASTE_NOREPLY_ADDRESS"
   ```
   ```bash
   git commit --amend --reset-author --no-edit
   ```
   This keeps your Gmail out of the public commit history.

## 2. Supabase: create the project
1. Go to https://supabase.com/dashboard and sign in (GitHub sign-in is easiest).
2. **New project**. Name `ojt-hunter`, set a strong database password (save it in your password
   manager, not in the repo), Region **Southeast Asia (Singapore)**. Free plan. Create.
3. When it finishes, open **Project Settings > API Keys**. Copy the **Publishable key**
   (starts with `sb_publishable_`). If you only see "anon / service_role" keys, copy the **anon** one.
4. Open **Project Settings > Data API** (or the Connect button) and copy the **Project URL**
   (`https://xxxx.supabase.co`).
5. In the project folder, copy `.env.example` to `.env.local` and fill in:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Do **not** copy the secret key yet.
6. Go to **Authentication > Sign In / Providers > Google**. Copy the **Callback URL** shown there
   (looks like `https://xxxx.supabase.co/auth/v1/callback`). Leave this tab open.

## 3. Google Cloud: OAuth client
1. Go to https://console.cloud.google.com, top bar project picker > **New project** > name
   `ojt-hunter` > Create, then select it.
2. Menu > **APIs & Services > OAuth consent screen** (may be called **Google Auth Platform**).
   Click **Get started**.
   - App name `OJT Hunter`, user support email = your Gmail.
   - Audience: **External**. Contact email: your Gmail. Agree and create.
3. **Data access** (or Scopes): only `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   Add nothing else (other scopes trigger Google verification).
4. **Clients > Create client**: Application type **Web application**, name `ojt-hunter web`.
   - Authorized JavaScript origins: `http://localhost:3000` (add the Vercel URL later in step 7).
   - Authorized redirect URIs: the Supabase **Callback URL** from step 2.6.
   - Create. Copy the **Client ID** and **Client secret** (keep them out of the repo and chat).
5. **Audience > Publish app** > Confirm. Status should say **In production**. Without this,
   classmates can't sign in reliably.

## 4. Supabase: turn on Google
1. Back on **Authentication > Sign In / Providers > Google**: enable it, paste the Client ID and
   Client secret, Save.
2. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000` for now (change to the Vercel URL in step 7).
   - Redirect URLs: add `http://localhost:3000/**`.

## 5. Test locally
```bash
npm run dev
```
Open http://localhost:3000, click **Sign in with Google**, pick your account. You should come back
and see "Signed in as ...". Click **Sign out**. Tell Claude if you get "Sign-in did not finish".

## 6. Push to GitHub
From the project folder (use the URL from your new repo page):
```bash
git remote add origin https://github.com/YOUR_USERNAME/ojt-hunter.git
```
```bash
git push -u origin main
```
Before pushing, Claude runs the secret check from `tests/sprints/P0/README.md`.

## 7. Vercel: deploy
1. Go to https://vercel.com/new, sign in with GitHub, **Import** `ojt-hunter`.
2. Framework should auto-detect **Next.js**. Open **Environment Variables** and add the same two:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. **Deploy**. Copy the production URL (like `https://ojt-hunter.vercel.app`).
   If you add or change env vars after a deploy, go to **Deployments > ... > Redeploy**.
   `NEXT_PUBLIC_` values are baked in at build time, so old builds won't see new values.
4. Supabase > **Authentication > URL Configuration**: set Site URL to the Vercel URL and add
   `https://YOUR-APP.vercel.app/**` to Redirect URLs (keep the localhost one).
5. Google Cloud > **Clients > ojt-hunter web**: add the Vercel URL to Authorized JavaScript origins. Save.

## 8. Final checks
- Open the Vercel URL on your phone, sign in and out.
- Ask one classmate to sign in with their Google account (proves the app is published).
- Tell Claude the results so P0 can be marked done.
