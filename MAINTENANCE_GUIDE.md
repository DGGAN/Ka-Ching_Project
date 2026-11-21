# Ka-Ching! Code Update, OTA Hot-Update & Environment Maintenance Guide

## Standard Maintenance & Update Workflows

After the base `.apk` is installed on mobile devices, follow the workflow below based on what you modified:

---

### Workflow A: Updating Backend Code (`backend/`)

Backend changes do not require any Expo commands. Render automatically redeploys when commits are pushed to GitHub.

```bash
# Run from Project Root (Ka-Ching_Project/)
git add backend/
git commit -m "fix(backend): describe your backend change"
git push
```

**Effect:** _Render redeploys the Node.js/Express server within ~1 minute. All mobile APKs immediately use the updated backend logic._

---

### Workflow B: Updating Frontend UI / JS Code (frontend/src/)

Frontend JavaScript, screen layouts, modals, and styling changes do not require rebuilding the `.apk`. Push an OTA Hot-Update instead:

```bash
# 1. Commit and push code to GitHub (Run from Project Root)
git add frontend/
git commit -m "fix(frontend): describe your UI or logic change"
git push

# 2. Publish OTA update to all installed preview APKs (Run inside frontend/)
cd frontend
eas update --branch preview --environment preview --message "fix(frontend): describe your UI or logic change"
```

**Effect:** _Users simply close and reopen the Ka-Ching! mobile app twice (1st launch downloads the patch silently in the background; 2nd launch applies the new UI immediately)._

---

### Workflow C: Updating Frontend Environment Variables (frontend/.env)

If you update `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, or test persona credentials in `frontend/.env`:

```bash
# Run inside frontend/
cd frontend

# 1. Push the updated .env values to Expo Cloud's "preview" environment
eas env:push --environment preview --path .env

# 2. Publish a quick OTA update so installed APKs pull the new environment variables
eas update --branch preview --environment preview --message "chore(env): sync updated preview environment variables"
```

#### Alternative Web UI Method:

**1.** Go to _expo.dev_

**2.** Select _Project_ -> _Environment variables_

**3.** Edit values under `preview`

**4.** Run

```bash
eas update --branch preview --environment preview --message "chore(env): update env"
```

---

### Workflow D: Updating Backend Environment Variables (backend/.env)

If you update `MONGO_URI`, `GOOGLE_VISION_API_KEY`, `GEMINI_API_KEY`, `BREVO_API_KEY`, or `DEBUG_LOGS`:

**1.** Update your local `backend/.env` for local testing.

**2.** Open the _Render Dashboard_ -> Select your _kaching-backend service_ -> _Environment tab_

**3.** Update the key-value pair and click Save, rebuild, and deploy.

---
