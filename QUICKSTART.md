# Quick Start Guide - POST /api/generations

This guide will help you quickly test the generations endpoint.

## Prerequisites

1. Make sure the development server is running:
```bash
npm run dev
```

2. Ensure Supabase is configured and running:
```bash
# Start Supabase local instance (if not already running)
npx supabase start

# Check Supabase status
npx supabase status
```

Expected Supabase ports (from `supabase/config.toml`):
- API URL: `http://127.0.0.1:15431`
- DB URL: `postgresql://postgres:postgres@127.0.0.1:15432/postgres`
- Studio URL: `http://127.0.0.1:15434`
- Inbucket URL: `http://127.0.0.1:15435`

3. Verify environment variables in `.env`:
```bash
SUPABASE_URL=http://127.0.0.1:15431
SUPABASE_KEY=your-anon-key-from-supabase-status
```

## Quick Test with cURL

### 1. Minimum Length Test (1000 characters)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "'"$(python3 -c "print('a' * 1000)")"'"
  }'
```

**Expected:** 201 Created with 3 flashcards

### 2. Maximum Length Test (10000 characters)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "'"$(python3 -c "print('a' * 10000)")"'"
  }'
```

**Expected:** 201 Created with 7 flashcards

### 3. Error Test - Too Short

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Too short"
  }'
```

**Expected:** 400 Bad Request with validation error

## Quick Test with JavaScript

Create a file `test-api.js`:

```javascript
const BASE_URL = 'http://localhost:4321';

async function testGeneration() {
  const sourceText = 'a'.repeat(5000); // 5000 characters
  
  console.log('Testing POST /api/generations...');
  console.log(`Source text length: ${sourceText.length}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_text: sourceText })
    });
    
    const data = await response.json();
    
    console.log(`\nStatus: ${response.status}`);
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`\n✅ Success! Generated ${data.generated_count} flashcards`);
      console.log(`Generation ID: ${data.generation_id}`);
    } else {
      console.log('\n❌ Error occurred');
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testGeneration();
```

Run with:
```bash
node test-api.js
```

## Verify in Database

After a successful request, check the database:

```sql
-- View recent generations
SELECT 
  id,
  user_id,
  model,
  generated_count,
  source_text_length,
  generation_duration,
  created_at
FROM generations
ORDER BY created_at DESC
LIMIT 5;

-- View any errors
SELECT 
  id,
  error_code,
  error_message,
  model,
  created_at
FROM generation_error_logs
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Response Format

**Success (201):**
```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "Mock Question 1 based on provided text",
      "back": "Mock Answer 1 extracted from source material",
      "source": "ai-full"
    },
    {
      "front": "Mock Question 2 based on provided text",
      "back": "Mock Answer 2 extracted from source material",
      "source": "ai-full"
    }
  ],
  "generated_count": 2
}
```

**Error (400):**
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "source_text",
      "message": "Source text must be at least 1000 characters long"
    }
  ]
}
```

## Common Issues

### Issue: 404 Not Found
**Solution:** Make sure the dev server is running (`npm run dev`)

### Issue: Database errors
**Solution:** 
1. Check Supabase connection in `.env` file
2. Ensure Supabase is running: `npx supabase status`
3. If not running, start it: `npx supabase start`
4. Verify the ports match `supabase/config.toml`:
   - API: 15431
   - DB: 15432
   - Studio: 15434

### Issue: TypeScript errors
**Solution:** Run `npx tsc --noEmit` to check for type errors

## Performance Testing

Test retry logic (mock has 5% failure rate):

```bash
# Run 20 requests to see retry in action
for i in {1..20}; do
  echo "Request $i"
  curl -X POST http://localhost:4321/api/generations \
    -H "Content-Type: application/json" \
    -d '{"source_text":"'"$(python3 -c "print('a' * 2000)")"'"}' \
    -s | jq '.generated_count'
done
```

Check server logs to see retry attempts when failures occur.

## Next Steps

1. Review full API documentation: `src/pages/api/README.md`
2. Explore test scenarios: `src/pages/api/TESTING.md`
3. Read implementation details: `IMPLEMENTATION.md`
4. Check the service code: `src/lib/generation.service.ts`

## Need Help?

- Check console logs in the terminal where dev server is running
- Review error logs in the database
- Verify environment variables are set correctly
- Check Supabase status: `npx supabase status`
- View Supabase Studio: http://127.0.0.1:15434
- Check migrations: `npx supabase db diff`
