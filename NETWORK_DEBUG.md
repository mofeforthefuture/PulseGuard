# Network Request Debugging Guide

## How Requests Are Made

### 1. **Supabase Client Configuration**
- Location: `src/lib/supabase/client.ts`
- Uses `@supabase/supabase-js` library
- All requests go through Supabase's built-in fetch wrapper
- Custom fetch handler added for debugging

### 2. **Request Types**

#### Authentication Requests
- `supabase.auth.signUp()` - Creates new user
- `supabase.auth.signInWithPassword()` - Signs in user
- `supabase.auth.getSession()` - Gets current session
- `supabase.auth.getUser()` - Gets current user
- `supabase.auth.signOut()` - Signs out user

#### Database Requests
- `supabase.from('profiles').insert()` - Creates profile
- `supabase.from('profiles').update()` - Updates profile
- `supabase.from('profiles').select()` - Fetches profile
- `supabase.from('medical_profiles').insert()` - Creates medical profile

### 3. **Request Flow**

```
App Start
  ↓
AuthContext mounts
  ↓
Calls auth.getSession()
  ↓
Supabase makes HTTP request to: {supabaseUrl}/auth/v1/token?grant_type=refresh_token
  ↓
If session exists → Calls auth.getCurrentUser()
  ↓
Supabase makes HTTP request to: {supabaseUrl}/rest/v1/profiles?id=eq.{userId}
```

## Debugging Network Errors

### Check Console Logs

The app now logs:
1. **Supabase Config** - Shows if URL/key are loaded
2. **Request Details** - URL and method for each request
3. **Error Details** - Full error information

### Common Issues

#### 1. "Network request failed"
**Possible causes:**
- No internet connection
- Supabase URL is incorrect
- Supabase project is paused/deleted
- Firewall blocking requests

**Check:**
```javascript
// In console, you should see:
Supabase Config: {
  hasUrl: true,
  hasKey: true,
  urlPrefix: "https://xxxxx.supabase"
}
```

#### 2. "Missing Supabase environment variables"
**Solution:**
- Check `.env` file exists
- Verify variables are prefixed with `EXPO_PUBLIC_`
- Restart Expo server after changing `.env`

#### 3. "Failed to fetch" or CORS errors
**Solution:**
- Verify Supabase project is active
- Check Supabase dashboard → Settings → API
- Ensure URL format is: `https://xxxxx.supabase.co`

### Testing Network Connectivity

1. **Check if Supabase URL is accessible:**
   ```bash
   curl https://your-project.supabase.co/rest/v1/
   ```

2. **Verify environment variables:**
   - Check console for "Supabase Config" log
   - Should show `hasUrl: true` and `hasKey: true`

3. **Test with a simple request:**
   - Try signing up with a test email
   - Check console for request logs
   - Check Supabase dashboard for new user

### Request URLs

All Supabase requests follow this pattern:
- **Auth**: `{supabaseUrl}/auth/v1/{endpoint}`
- **Database**: `{supabaseUrl}/rest/v1/{table}`
- **Storage**: `{supabaseUrl}/storage/v1/{bucket}`

Example:
```
https://abcdefgh.supabase.co/auth/v1/token
https://abcdefgh.supabase.co/rest/v1/profiles
```

## Error Handling

The app now handles errors gracefully:
- ✅ Network errors are caught and logged
- ✅ Auth errors show user-friendly messages
- ✅ Missing config shows clear error message
- ✅ Session errors don't crash the app

## Next Steps

If you see "Network request failed":
1. Check console logs for specific error
2. Verify Supabase URL in `.env`
3. Test internet connection
4. Check Supabase project status
5. Verify API keys are correct
