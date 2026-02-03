# Updated Firebase Rules

Based on the rules you provided, here is the modified version you need to copy and paste into the Firebase Console.

This change allows **read** access to all authenticated users (so the Admin Dashboard can fetch all data), but keeps **write/edit** access strict (so users can only modify their own data).

### Copy and Paste this into Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /income_entries/{entry} {
      // MODIFIED: Allow any logged-in user to READ all entries (needed for Admin Dashboard)
      allow read: if request.auth != null;

      // UNCHANGED: Only allow users to UPDATE/DELETE their own data
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;

      // UNCHANGED: Only allow users to CREATE data for themselves
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Why this change?

The line `allow read: if request.auth != null;` permits the Admin Dashboard to query the entire collection to calculate totals. The original rule `allow read: ... uid == resource.data.userId` prevented viewing anyone else's data, which is why the dashboard was empty.
