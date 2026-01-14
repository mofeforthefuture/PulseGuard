# Supabase Authentication Setup Guide

## Current Status

The authentication code is properly implemented, but you need to ensure:

1. **Environment Variables are Set**
2. **Supabase Project is Configured**
3. **Database Schema is Run**

## ✅ What's Already Implemented

- ✅ Supabase client configuration
- ✅ Auth functions (signUp, signIn, signOut)
- ✅ Auth context with session management
- ✅ Secure storage for tokens (expo-secure-store)
- ✅ Profile creation on signup
- ✅ Row Level Security (RLS) policies

## 🔧 Setup Steps

### 1. Configure Environment Variables

Your `.env` file should contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: In Expo, you need to either:
- Use `EXPO_PUBLIC_` prefix (works with `process.env`)
- OR configure in `app.config.js` (better for production)

### 2. Create app.config.js (Recommended)

Create `app.config.js` in the root:

```javascript
export default {
  expo: {
    name: "pulseguard",
    slug: "pulseguard",
    // ... other config from app.json
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

### 3. Run Supabase Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema.sql`
4. Verify tables are created

### 4. Test Authentication

Try signing up with a test email. Check:
- Console for any errors
- Supabase dashboard → Authentication → Users (should see new user)
- Supabase dashboard → Table Editor → profiles (should see new profile)

## 🐛 Common Issues

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `.env` file exists and has the correct variables, then restart Expo.

### Issue: "Failed to sign up"
**Possible causes**:
- Supabase project not configured
- Email confirmation required (check Supabase Auth settings)
- Network error

### Issue: "Profile not created"
**Solution**: Check if the `profiles` table exists and RLS policies allow INSERT.

## 🔍 Testing Checklist

- [ ] `.env` file exists with correct values
- [ ] Supabase project created
- [ ] Database schema run successfully
- [ ] Can sign up new user
- [ ] Can sign in existing user
- [ ] Session persists after app restart
- [ ] Can sign out

## 📝 Next Steps

If authentication isn't working:
1. Check console logs for specific errors
2. Verify Supabase project is active
3. Check Supabase dashboard for user creation
4. Test with a simple signup flow
