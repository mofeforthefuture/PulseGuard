# OpenRouter API Setup

This guide explains how to set up OpenRouter API for ALARA's AI-powered chat responses.

## Overview

ALARA uses OpenRouter to access GPT-4o and GPT-4o-mini models for intelligent, personality-based chat responses. Users can customize ALARA's personality (friendly, sassy, rude, fun nurse, professional, caring).

## Setup Steps

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the API key

### 2. Configure API Key

#### Option A: Environment Variable (Recommended)

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
```

Then update `app.config.js` to include it:

```javascript
export default {
  expo: {
    // ... other config
    extra: {
      openrouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    },
  },
};
```

#### Option B: Direct in app.config.js (Not Recommended for Production)

```javascript
export default {
  expo: {
    // ... other config
    extra: {
      openrouterApiKey: 'your_api_key_here',
    },
  },
};
```

### 3. Run Database Migration

Execute the personality schema migration:

```bash
# In Supabase SQL Editor, run:
supabase/alara_personality_schema.sql
```

This adds the `alara_personality` column to the `profiles` table.

### 4. Model Selection

The app uses `openai/gpt-4o-mini` by default for cost efficiency. To use GPT-4o instead, update `DEFAULT_MODEL` in `src/lib/openrouter/client.ts`:

```typescript
const DEFAULT_MODEL = 'openai/gpt-4o'; // Full GPT-4o
// or
const DEFAULT_MODEL = 'openai/gpt-4o-mini'; // GPT-4o Mini (default)
```

## Personality Options

Users can choose from 6 personalities in Settings → ALARA:

1. **Friendly** 😊 - Warm and supportive
2. **Sassy** 😏 - Witty with attitude
3. **Rude** 🙄 - Brutally honest
4. **Fun Nurse** 🏥 - Bubbly and energetic
5. **Professional** 👔 - Knowledgeable and precise
6. **Caring** 💙 - Gentle and nurturing

## API Costs

- **GPT-4o Mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

The app limits responses to 200 tokens max to keep costs low.

## Testing

1. Set up the API key
2. Run the database migration
3. Open the app and go to Settings → ALARA
4. Select a personality
5. Open ALARA chat and send a message
6. Verify the response matches the selected personality

## Troubleshooting

### "OpenRouter API key not found"
- Check that `EXPO_PUBLIC_OPENROUTER_API_KEY` is set in `.env`
- Restart Expo dev server after adding environment variable
- Verify `app.config.js` includes the key in `extra`

### API Errors
- Check OpenRouter dashboard for rate limits
- Verify API key is valid and has credits
- Check network connectivity

### Personality Not Changing
- Verify database migration ran successfully
- Check that `alara_personality` column exists in `profiles` table
- Restart app after changing personality

## Security Notes

- Never commit API keys to version control
- Use environment variables for API keys
- Consider using Supabase Edge Functions for API calls in production (keeps keys server-side)
