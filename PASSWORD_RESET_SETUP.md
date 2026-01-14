# Password Reset Setup Guide (OTP-Based)

## ✅ What's Implemented

- ✅ Forgot Password Screen (`app/(auth)/forgot-password.tsx`)
- ✅ Reset Password Screen with OTP verification (`app/(auth)/reset-password.tsx`)
- ✅ Navigation from Login screen
- ✅ OTP code verification (6-digit code)
- ✅ Email sending via Supabase
- ✅ Password validation and confirmation
- ✅ No deep linking required - everything happens in-app!

## 🔧 Supabase Configuration

### 1. Enable Email OTP in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Ensure **Enable Email Provider** is turned on
4. **Enable Email OTP** should be enabled (this is the default)

### 2. Email Template (Optional)

You can customize the OTP email template in:
- **Authentication** → **Email Templates** → **Magic Link** (OTP uses this template)

The email will contain a 6-digit code that users enter in the app.

## 📱 How It Works

### User Flow

1. **User taps "Forgot password?" on login screen**
   - Navigates to forgot password screen

2. **User enters email and taps "Send Code"**
   - Supabase sends OTP code via email
   - User sees confirmation message with "Enter Code" button

3. **User taps "Enter Code"**
   - Navigates to reset password screen
   - Shows code input field

4. **User enters 6-digit code from email**
   - Code is verified via Supabase
   - If valid, proceeds to password reset step

5. **User enters new password**
   - Validates password (min 6 characters)
   - Confirms password matches
   - Updates password via Supabase

6. **Success!**
   - Shows success message
   - Auto-redirects to login screen after 2 seconds

## 🎯 Advantages of OTP Flow

- ✅ **No deep linking needed** - everything happens in the app
- ✅ **Works reliably** - no issues with email clients or app opening
- ✅ **Better UX** - user stays in the app throughout the process
- ✅ **More secure** - code expires after 10 minutes
- ✅ **Mobile-friendly** - perfect for mobile apps

## 🔗 Deep Linking

The app uses the scheme `pulseguard://` configured in `app.config.js`.

When the user clicks the reset link in their email:
- **iOS**: Opens the app automatically if installed
- **Android**: Opens the app automatically if installed
- **Web**: Redirects to the web app (if configured)

## 🐛 Troubleshooting

### Issue: "Invalid Link" or "Link Expired"

**Causes:**
- Link was clicked more than 1 hour after being sent
- Link was already used
- App wasn't properly opened from the email link

**Solution:**
- Request a new password reset link
- Make sure the redirect URL is configured in Supabase dashboard

### Issue: App doesn't open from email link

**Causes:**
- Deep linking not configured properly
- App not installed on device
- Email client doesn't support deep links

**Solution:**
- Verify `scheme: "pulseguard"` in `app.config.js`
- Test deep linking: `npx expo start` and try opening `pulseguard://reset-password`
- For production, ensure deep linking is configured in app stores

### Issue: "Auth Session missing" on reset screen

**Causes:**
- User opened the app manually instead of from email link
- Tokens expired before user reached the screen

**Solution:**
- User should click the link in the email again
- Request a new reset link if needed

## 📝 Testing

### Test Password Reset Flow

1. Go to login screen
2. Tap "Forgot password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link (should open app)
6. Enter new password
7. Confirm password
8. Should redirect to login screen

### Test Deep Linking Manually

```bash
# iOS Simulator
xcrun simctl openurl booted "pulseguard://reset-password"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "pulseguard://reset-password"
```

## 🔒 Security Notes

- Password reset links expire after 1 hour (Supabase default)
- Links can only be used once
- Passwords must be at least 6 characters
- All password updates require a valid session from the reset link
