# API Documentation

## POST /api/generations

Initiates the AI flashcard generation process based on user-provided source text.

### Request

**Endpoint:** `POST /api/generations`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "source_text": "string (1000-10000 characters)"
}
```

**Validation Rules:**

- `source_text` must be a string
- Minimum length: 1000 characters
- Maximum length: 10000 characters

### Response

**Success (201 Created):**

```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "Question text",
      "back": "Answer text",
      "source": "ai-full"
    }
  ],
  "generated_count": 5
}
```

**Error Responses:**

**400 Bad Request** - Invalid input data:

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

**400 Bad Request** - Invalid JSON:

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON format"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while processing your request"
}
```

### Example Usage

#### cURL

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit... (1000+ characters)"
  }'
```

#### JavaScript (fetch)

```javascript
const response = await fetch("/api/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    source_text: "Your text content here (1000-10000 characters)...",
  }),
});

const data = await response.json();

if (response.ok) {
  console.log("Generation ID:", data.generation_id);
  console.log("Generated flashcards:", data.flashcards_proposals);
} else {
  console.error("Error:", data.error, data.message);
}
```

#### Python (requests)

```python
import requests

url = 'http://localhost:4321/api/generations'
payload = {
    'source_text': 'Your text content here (1000-10000 characters)...'
}

response = requests.post(url, json=payload)
data = response.json()

if response.status_code == 201:
    print(f"Generation ID: {data['generation_id']}")
    print(f"Generated {data['generated_count']} flashcards")
else:
    print(f"Error: {data['error']}")
```

### Implementation Details

- **AI Service:** Currently uses a mock implementation that generates 3-7 flashcards based on text length
- **Timeout:** AI service calls have a 60-second timeout
- **Database:** Generation metadata is stored in the `generations` table
- **Error Logging:** Errors are logged to the `generation_error_logs` table
- **Hash Algorithm:** MD5 is used for source text deduplication

### Local Development Setup

**Supabase Configuration** (from `supabase/config.toml`):

- API Port: 15431
- Database Port: 15432
- Studio Port: 15434 (admin interface)
- Inbucket Port: 15435 (email testing)

**Required Commands:**

```bash
# Start Supabase local instance
npx supabase start

# Check status and get connection details
npx supabase status

# Start Astro dev server
npm run dev

# View Supabase Studio (database admin)
# Open: http://127.0.0.1:15434
```

**Environment Variables:**

```bash
SUPABASE_URL=http://127.0.0.1:15431
SUPABASE_KEY=<anon-key-from-supabase-status>
```

### Development Notes

- Authentication is disabled in the current implementation (uses `DEFAULT_USER_ID`)
- The mock AI service simulates realistic behavior with random delays (200-500ms)
- All flashcard proposals have `source: "ai-full"` in development mode
