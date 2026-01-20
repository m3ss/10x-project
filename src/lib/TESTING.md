# Testing OpenRouter Service Integration

This guide explains how to test the OpenRouter Service integration.

## Quick Start

### 1. Configure Environment Variables

Create or update your `.env` file:

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Optional - Model Configuration
OPENROUTER_MODEL=openai/gpt-4o-mini        # Default: openai/gpt-4-turbo
OPENROUTER_TEMPERATURE=0.7                  # Default: 0.7, Range: 0-2
OPENROUTER_TOP_P=0.9                        # Default: 0.9, Range: 0-1

# Optional - Service Configuration
AI_SERVICE_PROVIDER=openrouter              # Default: openrouter
AI_SERVICE_TIMEOUT=60000                    # Default: 60000ms
```

### 2. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4321` (or next available port).

## Testing Methods

### Method 1: Interactive Web UI (Recommended)

Open in your browser:

```
http://localhost:4322/test-openrouter
```

This page provides:
- ✅ Configuration overview
- ✅ Individual test buttons
- ✅ Real-time results
- ✅ Visual feedback
- ✅ Detailed JSON responses

### Method 2: API Endpoints

Test via direct API calls:

#### Check Configuration

```bash
curl http://localhost:4322/api/test-openrouter?test=config
```

Response:
```json
{
  "success": true,
  "config": {
    "hasApiKey": true,
    "apiKeyPreview": "sk-or-v1-...",
    "model": "openai/gpt-4o-mini",
    "temperature": "0.7",
    "topP": "0.9",
    "provider": "openrouter",
    "timeout": "60000"
  }
}
```

#### Basic Response Test

```bash
curl http://localhost:4322/api/test-openrouter?test=basic
```

#### Flashcard Generation Test

```bash
curl http://localhost:4322/api/test-openrouter?test=flashcards
```

#### Run All Tests

```bash
curl http://localhost:4322/api/test-openrouter?test=all
```

### Method 3: PowerShell (Windows)

```powershell
# Test configuration
Invoke-WebRequest -Uri 'http://localhost:4322/api/test-openrouter?test=config' -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test basic response
Invoke-WebRequest -Uri 'http://localhost:4322/api/test-openrouter?test=basic' -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

# Test flashcard generation
Invoke-WebRequest -Uri 'http://localhost:4322/api/test-openrouter?test=flashcards' -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## Testing Different Configurations

### Test 1: Default Configuration

```bash
# .env
AI_SERVICE_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
```

**Expected behavior:**
- Model: `openai/gpt-4-turbo`
- Temperature: `0.7`
- Top-P: `0.9`

### Test 2: Custom Model

```bash
# .env
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Expected behavior:**
- Uses cheaper/faster model
- Faster response times
- Lower costs

### Test 3: High Creativity (Creative Flashcards)

```bash
# .env
OPENROUTER_TEMPERATURE=1.2
OPENROUTER_TOP_P=0.95
```

**Expected behavior:**
- More creative/varied flashcards
- Less deterministic responses
- More diverse question styles

### Test 4: Low Temperature (Deterministic)

```bash
# .env
OPENROUTER_TEMPERATURE=0.3
OPENROUTER_TOP_P=0.8
```

**Expected behavior:**
- More consistent responses
- More focused/precise flashcards
- Better for factual content

### Test 5: Mock Mode (No API Key)

```bash
# .env
AI_SERVICE_PROVIDER=mock
# Don't set OPENROUTER_API_KEY
```

**Expected behavior:**
- Falls back to mock implementation
- No API calls
- Returns sample flashcards

## Validation Checks

### ✅ Configuration Validation

The service validates parameters:

- **Temperature**: Must be between 0 and 2
  - Invalid values fall back to 0.7
  - `NaN` falls back to 0.7

- **Top-P**: Must be between 0 and 1
  - Invalid values fall back to 0.9
  - `NaN` falls back to 0.9

### ✅ Flashcard Validation

Generated flashcards are validated for:

- **Count**: 3-7 flashcards per generation
- **Front**: Max 200 characters
- **Back**: Max 500 characters
- **Required fields**: Both front and back must be non-empty

## Expected Test Results

### Basic Response Test

```json
{
  "success": true,
  "response": "2 + 2 equals 4."
}
```

### Flashcard Generation Test

```json
{
  "success": true,
  "flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "TypeScript is a strongly typed programming language that builds on JavaScript."
    },
    // ... 2-6 more flashcards
  ],
  "count": 5
}
```

### All Tests

```json
{
  "success": true,
  "tests": {
    "config": { /* config details */ },
    "basic": { /* basic test result */ },
    "flashcards": { /* flashcard generation result */ }
  }
}
```

## Troubleshooting

### Error: "OPENROUTER_API_KEY not configured"

**Solution:** Add your API key to `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Error: "Authentication failed - invalid API key"

**Solution:**
1. Verify your API key is correct
2. Check https://openrouter.ai/keys for your key
3. Ensure no extra spaces in `.env`

### Error: "Rate limit exceeded"

**Solution:**
1. Wait a few minutes
2. Use a different model with higher limits
3. Upgrade your OpenRouter plan

### Error: "Request timeout"

**Solution:**
1. Increase timeout: `AI_SERVICE_TIMEOUT=120000`
2. Use a faster model: `OPENROUTER_MODEL=openai/gpt-3.5-turbo`

### Error: "Provider returned error"

**Solution:**
1. Check OpenRouter status: https://status.openrouter.ai
2. Verify model name is correct
3. Check model availability for your account

### Flashcards are too generic/poor quality

**Solution:**
1. Lower temperature for more focused responses:
   ```bash
   OPENROUTER_TEMPERATURE=0.5
   ```
2. Use a better model:
   ```bash
   OPENROUTER_MODEL=openai/gpt-4-turbo
   ```

### Flashcards are too similar/repetitive

**Solution:**
1. Increase temperature for more variety:
   ```bash
   OPENROUTER_TEMPERATURE=0.9
   OPENROUTER_TOP_P=0.95
   ```

## Performance Benchmarks

Typical response times (may vary):

| Model                  | Basic Test | Flashcards | Cost (per 1M tokens) |
|------------------------|------------|------------|----------------------|
| gpt-3.5-turbo          | 1-2s       | 3-5s       | $0.50 / $1.50        |
| gpt-4o-mini            | 1-2s       | 3-5s       | $0.15 / $0.60        |
| gpt-4-turbo            | 2-4s       | 5-8s       | $10 / $30            |
| claude-3-opus          | 2-4s       | 5-10s      | $15 / $75            |

**Recommendation:** Use `gpt-4o-mini` for development/testing, `gpt-4-turbo` for production.

## Integration with GenerationService

The OpenRouter service is automatically used by `GenerationService` when:

1. `AI_SERVICE_PROVIDER=openrouter` (in `.env`)
2. `OPENROUTER_API_KEY` is set

To test the full integration:

```bash
# Use the main generation endpoint
curl -X POST http://localhost:4322/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Your educational text here (1000-10000 chars)"
  }'
```

## Monitoring

### Logs to Watch

The service logs important events:

```
[GenerationService] OpenRouter service initialized - Model: gpt-4o-mini, Temperature: 0.7, Top-P: 0.9
[GenerationService] Calling OpenRouter API...
[OpenRouterService] Request attempt 1/3
[OpenRouterService] Sending request to https://openrouter.ai/api/v1/chat/completions with model gpt-4o-mini
[OpenRouterService] Request successful, tokens used: 245
[GenerationService] OpenRouter API returned 5 flashcards
```

### Success Indicators

✅ Service initialized without warnings
✅ Requests complete in reasonable time (<10s for flashcards)
✅ Tokens used are logged
✅ No retry attempts needed
✅ Flashcards meet quality criteria

### Warning Signs

⚠️ Multiple retry attempts
⚠️ Timeout warnings
⚠️ Fallback to mock mode
⚠️ Rate limit warnings
⚠️ Unusually high token usage

## Next Steps

After successful testing:

1. ✅ Update `.env.example` with template
2. ✅ Document your chosen configuration
3. ✅ Set production API keys
4. ✅ Monitor usage and costs
5. ✅ Adjust parameters based on results
