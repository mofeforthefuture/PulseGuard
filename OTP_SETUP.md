# OTP Email Setup Guide

## 🔧 Supabase Configuration Required

For OTP codes to work, you need to configure Supabase to send OTP emails instead of magic links.

### 1. Enable Email OTP in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers** → **Email**
3. Make sure:
   - ✅ **Enable Email Provider** is turned ON
   - ✅ **Enable Email OTP** is turned ON (this is the key setting!)

### 2. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. You'll see templates for:
   - **Magic Link** (for passwordless login)
   - **Change Email Address**
   - **Reset Password**
   - **Signup** (confirmation email)

3. For OTP to work, Supabase uses the **Magic Link** template but sends a code instead
4. The email should contain: `{{ .Token }}` or `{{ .TokenHash }}` which will be replaced with the 6-digit code

### 3. Check Email Settings

1. Go to **Settings** → **Auth**
2. Under **Email Auth**, check:
   - **Enable email confirmations** - Should be ON for signup verification
   - **Secure email change** - Optional
   - **Email template** - Should be configured

### 4. Test Email Sending

1. Go to **Authentication** → **Users**
2. Try creating a test user
3. Check if email is received
4. Check Supabase logs: **Logs** → **Auth Logs** for any errors

## 🐛 Troubleshooting

### Issue: No OTP code received

**Possible causes:**

1. **Email OTP not enabled**
   - Solution: Enable it in Authentication → Providers → Email

2. **Email not configured**
   - Solution: Check if you have SMTP configured or using Supabase's default email

3. **Email in spam folder**
   - Solution: Check spam/junk folder

4. **Supabase project on free tier**
   - Free tier has email sending limits
   - Check if you've exceeded the limit

5. **Email template issue**
   - The template might not be configured for OTP
   - Check email templates in dashboard

### Issue: "Failed to send code" error

**Check console logs for:**
- Network errors
- Supabase configuration errors
- Email provider errors

**Solutions:**
1. Check Supabase dashboard → Logs → Auth Logs
2. Verify email provider is enabled
3. Try using `resend` API as fallback (already implemented in code)

### Issue: Code received but doesn't work

**Possible causes:**
1. Code expired (codes expire after 10 minutes)
2. Code already used
3. Wrong code entered

**Solution:** Request a new code

## 📧 Email Template Example

If you need to customize the email template, it should include:

```
Your verification code is: {{ .Token }}

This code will expire in 10 minutes.
```

Or for Supabase's default OTP:
```
Your code is: {{ .Token }}
```

## ✅ Verification Checklist

- [ ] Email provider enabled in Supabase
- [ ] Email OTP enabled in Supabase
- [ ] Email templates configured
- [ ] Test email received successfully
- [ ] Code is 6 digits
- [ ] Code works when entered in app

## 🔍 Debug Steps

1. **Check Supabase Logs:**
   - Dashboard → Logs → Auth Logs
   - Look for OTP send attempts and errors

2. **Check Console:**
   - Look for "Sending OTP code to:" logs
   - Check for any error messages

3. **Test Email Manually:**
   - Try the "Send Code" button on email confirmation screen
   - Check if email arrives

4. **Verify Configuration:**
   - Authentication → Providers → Email
   - Make sure OTP is enabled

If you're still having issues, the code will fall back to using `resend` API which might send a magic link email instead. In that case, you may need to configure Supabase email settings properly.
