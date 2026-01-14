# Supabase OTP Configuration for Signup

## 🔍 Issue Identified

The log shows `"user_recovery_requested"` which means Supabase is sending a **password recovery email** instead of a **signup verification email**.

This happens because:
- `signInWithOtp()` is designed for password recovery/login, not signup verification
- For signup, Supabase automatically sends a confirmation email when you call `signUp()`
- We need to configure Supabase to send **OTP codes** instead of **magic links** for signup

## ✅ Solution: Configure Supabase Email Templates

### Step 1: Configure Signup Email Template for OTP

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. Click on **"Signup"** template
4. Update the template to include the OTP code:

```html
<h2>Confirm your signup</h2>
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>Enter this 6-digit code in the app to verify your email.</p>
<p>This code will expire in 10 minutes.</p>
```

**Important:** The `{{ .Token }}` variable contains the 6-digit OTP code.

### Step 2: Enable OTP for Signup

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure:
   - ✅ **Enable Email Provider** is ON
   - ✅ **Enable Email OTP** is ON
3. Under **Email Auth Settings**:
   - **Enable email confirmations** should be ON
   - This ensures signup emails are sent

### Step 3: Verify Email Sending

1. Check **Logs** → **Auth Logs** after signup
2. Look for `"action":"user_signedup"` (not `"user_recovery_requested"`)
3. Check your email inbox for the verification code

## 🔄 Current Flow (After Fix)

1. User signs up → `signUp()` is called
2. Supabase automatically sends signup confirmation email with OTP code
3. We also call `resend()` to ensure email is sent
4. User receives email with 6-digit code
5. User enters code in app → `verifyOtp()` verifies it
6. User is authenticated and can proceed to onboarding

## 🐛 Why You're Getting Recovery Email

The issue is that `signInWithOtp()` after signup triggers password recovery flow, not signup verification. 

**Fixed:** Now we use `resend()` with type `signup` which sends the proper signup confirmation email.

## 📧 Email Template Variables

For signup OTP emails, you can use:
- `{{ .Token }}` - The 6-digit OTP code
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - Confirmation URL (if using links)

## ✅ Verification

After configuring:
1. Sign up with a test email
2. Check email inbox (and spam folder)
3. You should receive an email with subject like "Confirm your signup"
4. Email should contain a 6-digit code
5. Enter code in app → should work!

## 🔍 Debugging

If still not working:
1. Check **Logs** → **Auth Logs** for the signup event
2. Look for `"action":"user_signedup"` (correct) vs `"user_recovery_requested"` (wrong)
3. Check email template in dashboard
4. Verify OTP is enabled in email provider settings
