# User Data Collection Recommendations

## Current State Analysis

### ❌ What We're NOT Saving (But Should)

1. **First Name** - Not saved
2. **Last Name** - Not saved  
3. **Full Name** - Not saved
4. **Phone Number** - Not saved
5. **Profile Image URL** - Not saved

### ✅ What We ARE Saving

1. **Email** - Partially saved (optional parameter, often null)
2. **Clerk User ID** - Always saved
3. **Subscription Info** - Saved
4. **Onboarding Data** - Saved

### 🐛 Current Problem

In the welcome email code, we try to access:
```javascript
userData?.first_name || userData?.name
```

But these fields **don't exist** in our database, so emails can't be personalized!

---

## Recommended Data to Collect

### 🔴 **ESSENTIAL** (Must Have for Best UX)

1. **First Name** ✅
   - **Why**: Personalization in emails ("Hi John,"), UI greetings, better UX
   - **Source**: `user.firstName` from Clerk
   - **Priority**: HIGH

2. **Last Name** ✅
   - **Why**: Full name display, professional emails, user identification
   - **Source**: `user.lastName` from Clerk
   - **Priority**: HIGH

3. **Email** ✅
   - **Why**: Email notifications, account recovery, communication
   - **Source**: `user.emailAddresses[0].emailAddress` from Clerk
   - **Priority**: HIGH
   - **Note**: Currently optional, should be required

4. **Full Name** ✅
   - **Why**: Convenience field, faster queries, display purposes
   - **Source**: Computed from `firstName + lastName`
   - **Priority**: HIGH

### 🟡 **IMPORTANT** (Should Have)

5. **Phone Number** ✅
   - **Why**: SMS notifications, account recovery, two-factor auth
   - **Source**: `user.phoneNumbers[0].phoneNumber` from Clerk
   - **Priority**: MEDIUM
   - **Note**: Optional, but valuable for engagement

6. **Profile Image URL** ✅
   - **Why**: Better UX, personalization, visual identification
   - **Source**: `user.imageUrl` from Clerk
   - **Priority**: MEDIUM
   - **Note**: Nice to have for UI polish

### 🟢 **NICE TO HAVE** (Future Enhancements)

7. **Timezone** ✅
   - **Why**: Scheduled emails at right time, localized timestamps
   - **Source**: Browser timezone or user preference
   - **Priority**: LOW
   - **Note**: Can be added later

8. **Language Preference** ✅
   - **Why**: Internationalization, localized content
   - **Source**: Browser language or user preference
   - **Priority**: LOW
   - **Note**: For future i18n support

---

## Implementation Status

### ✅ Completed

1. **Database Migration** - Created `migration_add_user_profile_fields.sql`
   - Adds: `first_name`, `last_name`, `full_name`, `phone`, `profile_image_url`, `timezone`, `language_preference`

2. **Backend Updates**
   - Updated `getOrCreateUser()` to accept and save user profile data
   - Added `syncUserProfile()` function to update existing users
   - Added middleware to extract user profile from request headers
   - Updated `/api/user/profile` to sync profile data
   - Added `/api/user/sync-profile` endpoint

3. **Frontend Updates**
   - Updated `AppRouter.jsx` to send user profile data in headers
   - Sends: email, firstName, lastName, phoneNumber, imageUrl

### 📋 Next Steps

1. **Run Database Migration**
   ```sql
   -- Execute in Supabase
   \i supabase/migration_add_user_profile_fields.sql
   ```

2. **Test User Creation**
   - Sign up a new user
   - Verify profile data is saved
   - Check welcome email personalization

3. **Update Email Templates**
   - Emails will now use `first_name` or `full_name` for personalization
   - Test welcome email with real user data

4. **Optional: Add Profile Sync on Login**
   - Create a hook/utility to sync profile on every login
   - Ensures data stays up-to-date if user changes profile in Clerk

---

## Data Flow

```
Clerk User Signs Up
    ↓
Frontend (AppRouter.jsx)
    ↓
Sends headers: X-User-Email, X-User-First-Name, etc.
    ↓
Backend (server.js)
    ↓
Extracts profile from headers
    ↓
getOrCreateUser(clerkUserId, userProfile)
    ↓
Saves to database: first_name, last_name, email, etc.
    ↓
Used in: Emails, UI, Personalization
```

---

## Benefits

1. **Personalized Emails** - "Hi John," instead of "Hi,"
2. **Better UX** - Display user's name throughout the app
3. **Professional Communication** - Use full names in emails
4. **Account Recovery** - Phone number for SMS verification
5. **Visual Identity** - Profile images in UI
6. **Future Features** - Timezone for scheduled emails, language for i18n

---

## Security & Privacy

- ✅ All data comes from Clerk (already authenticated)
- ✅ User can update profile in Clerk dashboard
- ✅ Profile sync is non-destructive (only fills missing fields)
- ✅ No sensitive data stored (just display info)
- ✅ GDPR compliant (user controls data in Clerk)

---

## Testing Checklist

- [ ] Run database migration
- [ ] Sign up new user - verify profile saved
- [ ] Check welcome email - should have name
- [ ] Update profile in Clerk - verify sync works
- [ ] Test analysis complete email - should have name
- [ ] Verify UI displays user name correctly

