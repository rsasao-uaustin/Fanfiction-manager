# 🤖 OpenAI Integration Setup Guide

The Fanfiction Manager now supports real AI-powered story analysis using OpenAI!

## Quick Start

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)
6. **Important**: Save it securely - you won't be able to see it again!

### 2. Use the API Key

**Option A: Enter in the App (Recommended for Testing)**
- Go to AI Assistant view
- Paste your API key in the "OpenAI API Key" field
- The key is only used for that session (not stored)

**Option B: Environment Variable (Recommended for Production)**
- Set environment variable: `OPENAI_API_KEY=sk-your-key-here`
- On Windows (PowerShell):
  ```powershell
  $env:OPENAI_API_KEY="sk-your-key-here"
  ```
- On Mac/Linux:
  ```bash
  export OPENAI_API_KEY="sk-your-key-here"
  ```
- Then start the server - it will use the environment variable

### 3. Analyze Your Full Story

1. Go to **AI Assistant** view
2. Select your project from the dropdown
3. Check **"Analyze Full Story"** checkbox
4. (Optional) Add specific context or questions
5. Click any suggestion type button (Plot, Character, Dialogue, or Writing Tips)
6. The AI will read all your chapters and provide context-aware suggestions!

## Features

### Full Story Analysis
- **Reads all chapters** in your selected project
- **Understands the complete narrative** across multiple chapters
- **Provides context-aware suggestions** based on your actual story
- **References specific elements** from your writing

### Suggestion Types

**📈 Plot Ideas**
- Analyzes your plot structure
- Suggests conflicts, twists, and pacing improvements
- References specific plot points from your story

**👤 Character Development**
- Reviews character arcs across chapters
- Suggests growth opportunities
- Identifies relationship dynamics

**💬 Dialogue Tips**
- Analyzes dialogue patterns
- Suggests improvements for natural speech
- Identifies character voice consistency

**✨ Writing Tips**
- General style and narrative suggestions
- Pacing and description improvements
- Overall story quality feedback

## How It Works

1. **Select Project**: Choose which story to analyze
2. **Enable Full Story**: Check the box to include all chapters
3. **Add Context** (optional): Provide specific questions or areas of focus
4. **Get Suggestions**: Click a suggestion type button
5. **Review**: AI analyzes your entire story and provides tailored suggestions

## Cost Information

- Uses **GPT-4o-mini** model (cost-effective)
- Approximately **$0.15 per 1M input tokens** and **$0.60 per 1M output tokens**
- Typical analysis uses ~500-2000 tokens per request
- **Very affordable** for regular use

You can monitor usage at: https://platform.openai.com/usage

## Fallback Behavior

If OpenAI is unavailable or API key is missing:
- Falls back to **template-based suggestions**
- Still provides helpful writing tips
- No functionality is lost

## Security Notes

- **API keys are not stored** on the server
- Keys sent via frontend are only used for that request
- Environment variables are more secure for production
- Never commit API keys to version control

## Troubleshooting

### "OpenAI API error: Invalid API key"
- Check that your API key is correct
- Make sure it starts with `sk-`
- Verify the key hasn't expired

### "OpenAI API error: Insufficient quota"
- Check your OpenAI account billing
- You may need to add payment method
- See: https://platform.openai.com/account/billing

### "OpenAI library not available"
- Install dependencies: `pip install -r requirements.txt`
- Make sure `openai` package is installed

### Suggestions seem generic
- Make sure "Analyze Full Story" is checked
- Select a project with chapters
- The more content you have, the better the suggestions

### API key not working
- Try entering it directly in the app first
- If that works, then try environment variable
- Check for extra spaces when copying

## Advanced Usage

### Using Different Models

Edit `backend/app.py`, find `get_openai_suggestions()` function:

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",  # Change to "gpt-4" for better quality (more expensive)
    ...
)
```

### Adjusting Token Limits

In `backend/app.py`, find the context limit:

```python
{context[:15000]}  # Increase for longer stories
```

And max_tokens:

```python
max_tokens=1000  # Increase for longer responses
```

### Custom Prompts

Modify the prompts in `get_openai_suggestions()` function to customize what the AI focuses on.

## Best Practices

1. **Start with Full Story Analysis**: Get the most value by analyzing complete projects
2. **Be Specific**: Add context about what you want help with
3. **Review Suggestions**: AI suggestions are starting points - use your judgment
4. **Iterate**: Get suggestions multiple times as you write more chapters
5. **Monitor Costs**: Check your OpenAI usage dashboard regularly

## Example Workflow

1. Write several chapters in your project
2. Go to AI Assistant
3. Select your project
4. Enable "Analyze Full Story"
5. Add context: "I'm struggling with pacing in the middle chapters"
6. Click "📈 Plot Ideas"
7. Review AI suggestions
8. Apply what works for your story
9. Repeat as you continue writing!

---

**Happy writing with AI assistance!** 🤖✨
