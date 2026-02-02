# 🔥 Firebase Google Authentication Setup

## ⚠️ REQUIRED: Enable Google Sign-In Provider

Currently getting error: `auth/configuration-not-found`

This means **Google Authentication is NOT enabled** in your Firebase project.

---

## 📝 Step-by-Step Instructions

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click on your project: **money-view-e3ad1**

### Step 2: Navigate to Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. If prompted, click **Get Started** to enable Authentication

### Step 3: Enable Google Provider

1. Click on the **Sign-in method** tab at the top
2. Under **Sign-in providers**, find **Google**
3. Click on **Google** row

### Step 4: Configure Google Provider

1. Toggle the **Enable** switch to ON
2. **Project support email**: Select your email from dropdown
3. Click **Save**

### Step 5: Add Authorized Domains (if needed)

1. Scroll down to **Authorized domains** section
2. Verify `localhost` is already there
3. If deploying to production, add your domain (e.g., `yourapp.com`)
4. Click **Add domain** if needed

---

## ✅ Verification

After enabling:

1. Go back to your app at `http://localhost:3002/login`
2. Refresh the page (Cmd/Ctrl + R)
3. Click **Sign in with Google**
4. You should see the Google account picker popup
5. Select your account
6. You'll be redirected to the dashboard!

---

## 🐛 Common Issues & Solutions

### Issue: "Popup blocked"

**Solution:** Allow popups in your browser for `localhost:3002`

- Chrome: Click the blocked popup icon in address bar
- Firefox: Click "Preferences" in the popup blocker notification
- Safari: Safari → Preferences → Websites → Pop-up Windows

### Issue: "unauthorized-domain"

**Solution:** Add your domain to Firebase authorized domains

- Go to Authentication → Settings → Authorized domains
- Add `localhost` and any production domains

### Issue: Still getting errors after enabling

**Solution:**

1. Clear browser cache and cookies
2. Stop dev server (Ctrl+C)
3. Start again: `npm run dev`
4. Try signing in again

---

## 📸 Visual Guide

### 1. Firebase Console - Authentication

```
Firebase Console
└── money-view-e3ad1 (Your Project)
    └── Build
        └── Authentication
            └── Sign-in method
                └── Google ← Click here
```

### 2. Enable Toggle

```
┌─────────────────────────────────────┐
│ Google                        ⚫ OFF │  ← Toggle this to ON
│                               ─────  │
│ Allows users to sign in with Google │
└─────────────────────────────────────┘
```

### 3. After Enabling

```
┌─────────────────────────────────────┐
│ Google                        🟢 ON  │  ← Should be green
│                               ─────  │
│ Project support email:              │
│ [your-email@gmail.com]      ▼      │
│                                      │
│ [Save]  [Cancel]                    │
└─────────────────────────────────────┘
```

---

## 🎯 What This Enables

Once Google Auth is enabled:

✅ Users can sign in with their Google accounts
✅ OAuth 2.0 flow works automatically
✅ User profile data (name, email, photo) is retrieved
✅ Secure token-based authentication
✅ Multi-user support with isolated data

---

## 🔒 Security Notes

- Firebase handles all OAuth security
- User credentials never touch your server
- Tokens are automatically refreshed
- Session is persisted across page reloads
- Logout clears all auth tokens

---

## ⚡ Quick Commands

```bash
# Restart dev server after enabling auth
# Press Ctrl+C to stop
npm run dev

# Clear Next.js cache if issues persist
rm -rf .next
npm run dev
```

---

## 📞 Need Help?

If you're still having issues:

1. Check Firebase Console for error messages
2. Look at browser DevTools console for specific errors
3. Verify your Firebase credentials in `.env.local`
4. Make sure you're using the correct Firebase project

**Current Project:** money-view-e3ad1
**Project ID:** money-view-e3ad1
**Auth Domain:** money-view-e3ad1.firebaseapp.com

---

## ✨ After Setup

Once working, you'll see:

1. **Login page** → Click "Sign in with Google"
2. **Google popup** → Select your account
3. **Permissions** → Allow access
4. **Dashboard** → Redirected with your profile
5. **Header** → Your avatar and name appear

🎉 You're ready to use the authenticated app!
