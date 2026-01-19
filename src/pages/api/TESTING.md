# Test Examples for POST /api/generations

This file contains test examples and scenarios for testing the generations endpoint.

## Prerequisites

### 1. Start Development Environment

```bash
# Start Supabase (if not already running)
npx supabase start

# In another terminal, start Astro dev server
npm run dev
```

### 2. Verify Supabase Status

```bash
npx supabase status
```

Expected output should show:
- API URL: `http://127.0.0.1:15431`
- DB URL: `postgresql://postgres:postgres@127.0.0.1:15432/postgres`
- Studio URL: `http://127.0.0.1:15434`

### 3. Environment Setup

Ensure `.env` file contains:
```
SUPABASE_URL=http://127.0.0.1:15431
SUPABASE_KEY=<your-anon-key-from-supabase-status>
```

---

## Test Scenario 1: Valid Request (Minimum Length)

**Request:**
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "source_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur."
}
EOF
```

**Expected Response:** 201 Created with 3 flashcards (minimum)

---

## Test Scenario 2: Valid Request (Maximum Length)

Create a text file with exactly 10000 characters for testing.

**Request:**
```bash
# Generate 10000 character text
python3 << 'EOF'
text = "a" * 10000
print('{"source_text":"' + text + '"}')
EOF | curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @-
```

**Expected Response:** 201 Created with 7 flashcards (maximum)

---

## Test Scenario 3: Invalid Request - Text Too Short

**Request:**
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "This text is too short"
  }'
```

**Expected Response:** 400 Bad Request
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

---

## Test Scenario 4: Invalid Request - Text Too Long

**Request:**
```bash
# Generate 10001 character text
python3 << 'EOF'
text = "a" * 10001
print('{"source_text":"' + text + '"}')
EOF | curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @-
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "source_text",
      "message": "Source text must not exceed 10000 characters"
    }
  ]
}
```

---

## Test Scenario 5: Invalid Request - Malformed JSON

**Request:**
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{invalid json'
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON format"
}
```

---

## Test Scenario 6: Invalid Request - Missing Field

**Request:**
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "source_text",
      "message": "Required"
    }
  ]
}
```

---

## Test Scenario 7: Database Verification

After a successful request, verify the data in the database:

```sql
-- Check the generations table
SELECT * FROM generations ORDER BY created_at DESC LIMIT 1;

-- Verify fields:
-- - user_id should be DEFAULT_USER_ID
-- - model should be "mock-ai-v1"
-- - generated_count should be between 3 and 7
-- - source_text_hash should be MD5 hash
-- - source_text_length should match input length
-- - generation_duration should be > 0
```

---

## Test Scenario 8: Error Logging Verification

Simulate an error and check error logging:

```sql
-- Check generation_error_logs table
SELECT * FROM generation_error_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Automated Test Script (Node.js)

```javascript
// test-generations-endpoint.js
const BASE_URL = 'http://localhost:4321';

async function testEndpoint(name, sourceText, expectedStatus) {
  console.log(`\nTest: ${name}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_text: sourceText })
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status} (expected: ${expectedStatus})`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === expectedStatus) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('❌ FAIL');
  }
}

async function runTests() {
  // Valid requests
  await testEndpoint('Valid - Minimum length', 'a'.repeat(1000), 201);
  await testEndpoint('Valid - Maximum length', 'a'.repeat(10000), 201);
  await testEndpoint('Valid - Medium length', 'a'.repeat(5000), 201);
  
  // Invalid requests
  await testEndpoint('Invalid - Too short', 'short text', 400);
  await testEndpoint('Invalid - Too long', 'a'.repeat(10001), 400);
}

runTests();
```

Run with: `node test-generations-endpoint.js`
