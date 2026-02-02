# 🔥 Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "money-view")
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Create Firestore Database

1. In your Firebase project, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll set up rules after)
4. Select your region (choose closest to you)
5. Click "Enable"

## Step 3: Configure Firestore Rules

1. Go to the **Rules** tab in Firestore
2. Replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note**: These rules allow public read/write access. This is fine for a personal project but consider adding authentication for production use.

3. Click "Publish"

## Step 4: Get Your Firebase Config

1. Go to **Project settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app name: "money-view"
5. Copy the Firebase configuration object

## Step 5: Add Config to Your Project

1. In your project root, create `.env.local` file
2. Add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace the values with your actual Firebase config values.

## Step 6: Seed Your Data (Optional)

To populate your database with the 2025 income data:

```bash
npm run seed
```

This will add all the primary and secondary income entries you provided.

## ✅ You're All Set!

Now run your dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start tracking your income! 💰
