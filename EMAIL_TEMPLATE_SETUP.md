# Email Template Setup Guide

## 🎨 Beautiful Email Templates Created

I've created two modern, branded email templates for PulseGuard:

1. **Signup OTP Template** (`email-templates/signup-otp.html`)
2. **Password Reset OTP Template** (`email-templates/password-reset-otp.html`)

## ✨ Features

- 🎨 **Modern Design** - Clean, professional, medical-themed
- 📱 **Mobile Responsive** - Looks great on all devices
- 🎯 **Clear OTP Display** - Large, easy-to-read 6-digit code
- 💜 **Brand Colors** - Matches PulseGuard's purple/calm aesthetic
- 📋 **Step-by-step Instructions** - Guides users through the process
- ⏰ **Expiry Notices** - Clear security information
- 🤖 **ALARA Branding** - Mentions your AI assistant

## 📝 How to Set Up in Supabase

### Step 1: Access Email Templates

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - **Signup** (for account verification)
   - **Magic Link** (for passwordless login)
   - **Change Email Address**
   - **Reset Password** (for password recovery)

### Step 2: Update Signup Template

1. Click on **"Signup"** template
2. Copy the entire content from `email-templates/signup-otp.html`
3. Paste it into the template editor
4. **Important:** Make sure `{{ .Token }}` is in the template (it's already there)
5. Click **"Save"**

### Step 3: Update Password Reset Template

1. Click on **"Magic Link"** template (OTP uses this for password reset)
2. Copy the entire content from `email-templates/password-reset-otp.html`
3. Paste it into the template editor
4. Make sure `{{ .Token }}` is present
5. Click **"Save"**

### Step 4: Test the Templates

1. Sign up with a test email
2. Check your inbox for the beautifully formatted email
3. Verify the OTP code is displayed correctly
4. Test on mobile device to ensure responsiveness

## 🎨 Design Details

### Signup Email
- **Header:** Purple gradient (PulseGuard brand colors)
- **OTP Display:** Large, centered code in purple-themed container
- **Instructions:** Step-by-step guide with emojis
- **ALARA Mention:** Friendly note about the AI assistant
- **Footer:** Professional, clean design

### Password Reset Email
- **Header:** Red gradient (indicates security action)
- **OTP Display:** Large, centered code in red-themed container
- **Security Notice:** Clear warning if user didn't request reset
- **Instructions:** Step-by-step password reset guide
- **Footer:** Professional, clean design

## 🔧 Customization

You can customize the templates by:

1. **Colors:** Change the gradient colors in the `.header` CSS
2. **Branding:** Update the PulseGuard name/logo
3. **Content:** Modify the greeting and instructions text
4. **Styling:** Adjust fonts, spacing, and layout

## 📧 Template Variables

Supabase provides these variables you can use:

- `{{ .Token }}` - **The 6-digit OTP code** (required!)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - Confirmation URL (if using links)

## ✅ Verification Checklist

After setting up:

- [ ] Signup template updated with OTP code display
- [ ] Password reset template updated (Magic Link template)
- [ ] `{{ .Token }}` variable is present in both templates
- [ ] Test email received and looks good
- [ ] OTP code is clearly visible
- [ ] Mobile view looks good
- [ ] All links and styling work correctly

## 🎯 Result

Your users will now receive beautiful, professional emails that:
- Match your app's design aesthetic
- Clearly display the OTP code
- Provide helpful instructions
- Build trust and confidence
- Work perfectly on mobile devices

The templates are ready to use - just copy and paste into Supabase! 🚀
