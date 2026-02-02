# Google Authentication Implementation Plan

Add Google authentication to Money View to enable user login and display user-specific financial data.

## Overview

This enhancement will add Firebase Google Authentication to allow users to sign in with their Google accounts. Each user will have their own private financial data that's automatically filtered based on their authentication status.

---

## Proposed Changes

### Authentication Setup

#### [MODIFY] [firebase.ts](file:///Users/abi/Documents/Me/Money-View/lib/firebase.ts)

Add Firebase Authentication initialization:

- Import `getAuth` from Firebase
- Export `auth` instance
- Configure Google Auth provider

#### [NEW] [lib/auth-context.tsx](file:///Users/abi/Documents/Me/Money-View/lib/auth-context.tsx)

Create authentication context provider:

- User state management
- Loading state tracking
- Sign in/out functions
- Auth state listener

#### [NEW] [hooks/use-auth.ts](file:///Users/abi/Documents/Me/Money-View/hooks/use-auth.ts)

Custom hook to access auth context:

- `useAuth()` hook
- Type-safe user data access
- Auth state helpers

---

### UI Components

#### [NEW] [app/login/page.tsx](file:///Users/abi/Documents/Me/Money-View/app/login/page.tsx)

Login page with Google sign-in:

- Google sign-in button
- Logo and branding
- Loading states
- Error handling
- Auto-redirect on success

#### [MODIFY] [app/layout.tsx](file:///Users/abi/Documents/Me/Money-View/app/layout.tsx)

Wrap app with AuthProvider:

- Add `AuthProvider` component
- Maintain existing layout structure

#### [MODIFY] [app/page.tsx](file:///Users/abi/Documents/Me/Money-View/app/page.tsx)

Add authentication guard and user display:

- Check if user is authenticated
- Redirect to login if not
- Display user profile in header
- Add logout button
- Show user avatar and name

#### [NEW] [components/auth/user-profile.tsx](file:///Users/abi/Documents/Me/Money-View/components/auth/user-profile.tsx)

User profile dropdown component:

- User avatar (Google photo)
- Display name and email
- Logout button
- Dropdown menu design

---

### Data Model Updates

#### [MODIFY] [types/income.ts](file:///Users/abi/Documents/Me/Money-View/types/income.ts)

Add user ID to income entries:

```typescript
interface IncomeEntry {
    id: string;
    userId: string; // NEW: Owner of this entry
    amount: number;
    category: "primary" | "secondary";
    month: string;
    year: number;
    type: "credit" | "debit";
    description?: string;
    createdAt: Date;
}
```

#### [MODIFY] [lib/income-service.ts](file:///Users/abi/Documents/Me/Money-View/lib/income-service.ts)

Update all functions to filter by user ID:

- `addIncome()` - Include userId in new entries
- `getIncomeByYear()` - Filter by userId
- `deleteIncome()` - Verify ownership before delete
- `getMonthlyStats()` - Calculate for user's data only
- `getYearlyStats()` - Calculate for user's data only

---

### Firestore Security Rules

Update Firebase rules to enforce user data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /income_entries/{entry} {
      allow read, write: if request.auth != null &&
                          request.resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Implementation Steps

### 1. Enable Firebase Authentication

- Go to Firebase Console → Authentication
- Click "Get Started"
- Enable "Google" sign-in provider
- Add authorized domain (localhost for development)

### 2. Update Environment Variables

Add to `.env.local`:

```env
# Existing variables...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# No new variables needed for Google Auth
```

### 3. Install Dependencies

All required packages already installed:

- `firebase` - includes auth module
- No additional packages needed

---

## User Experience Flow

### Login Flow

1. User visits app → redirected to `/login`
2. Click "Sign in with Google"
3. Google OAuth popup opens
4. User selects Google account
5. Redirected to dashboard
6. User data loads automatically

### Dashboard Experience

1. Header shows user avatar + name
2. All data filtered to logged-in user
3. Click avatar → dropdown menu
4. "Logout" button → back to login

### Data Privacy

- Each user sees only their own income entries
- Data is automatically filtered by `userId`
- Firestore rules enforce security at database level

---

## Verification Plan

### Manual Testing

1. **Login Flow**
    - Visit app → should redirect to login
    - Click "Sign in with Google"
    - Verify successful login and redirect

2. **User Profile**
    - Check avatar displays in header
    - Verify name and email shown
    - Test logout functionality

3. **Data Filtering**
    - Add income entry → verify userId is saved
    - Logout and login as different user
    - Verify data is separate per user

4. **Security**
    - Try accessing dashboard without login
    - Verify redirect to login page
    - Test Firestore rules block unauthorized access

---

## Migration Notes

> [!IMPORTANT]
> **Existing Data**: Any data created before authentication will not have a `userId` field. Options:
>
> 1. Delete old data and re-seed after login
> 2. Manually assign userId to existing entries
> 3. Run a migration script
>
> Recommend: Re-seed data after first login using `npm run seed`

---

## Benefits

✅ **Secure** - User data is private and protected
✅ **Simple** - One-click Google login
✅ **Familiar** - Standard OAuth flow users know
✅ **Scalable** - Ready for multi-user deployment
✅ **Professional** - Production-ready authentication
