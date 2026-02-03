# Missing Firestore Index for User Detail Page

## Issue

The user detail page at `/admin/user/[userId]` shows "No entries found" because it requires a specific Firestore composite index.

**Error in console:** `FirebaseError: The query requires an index`

## Solution

You need to create a **second composite index** for the `income_entries` collection:

### Index Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** > **Indexes** tab
3. Click **Add Index** (or **Create Index**)
4. Configure the following:

| Field             | Order            |
| ----------------- | ---------------- |
| **Collection ID** | `income_entries` |
| **userId**        | Ascending        |
| **createdAt**     | Descending       |
| **Query scope**   | Collection       |

5. Click **Create Index**
6. Wait for the index to build (usually takes 1-2 minutes)

### Quick Link Method

When you see the error in the browser console, Firebase provides a direct link to create the index. Look for a URL like:

```
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

Click that link and it will automatically pre-fill all the settings for you!

## Why Two Indexes?

You now have two different queries in your app:

1. **Dashboard query** (line 25 in `admin-service.ts`):
    - Fetches ALL entries ordered by `createdAt`
    - Index: `createdAt` (DESC) only

2. **User detail query** (lines 106-110 in `admin-service.ts`):
    - Fetches entries WHERE `userId` equals a specific value, ordered by `createdAt`
    - Index: `userId` (ASC) + `createdAt` (DESC)

Each query needs its own composite index!

## Verification

After creating the index:

1. Wait 1-2 minutes for it to build
2. Refresh the user detail page
3. You should now see all income entries for that user
