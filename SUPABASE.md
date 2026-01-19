# Supabase Configuration

## Overview

This project uses **Supabase** as the backend database and authentication service. The local development environment uses custom ports to avoid conflicts.

## Port Configuration

The following ports are configured in `supabase/config.toml`:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| API | 15431 | http://127.0.0.1:15431 | Supabase REST API |
| Database | 15432 | postgresql://postgres:postgres@127.0.0.1:15432/postgres | PostgreSQL database |
| Studio | 15434 | http://127.0.0.1:15434 | Admin interface |
| Inbucket | 15435 | http://127.0.0.1:15435 | Email testing |

**Note:** These are **non-standard** ports (default Supabase uses 54321-54327 range). The custom ports were chosen to avoid conflicts with other services.

## Setup Instructions

### 1. Install Supabase CLI

```bash
# If not already installed
npm install -g supabase
```

### 2. Start Supabase

```bash
# Start all Supabase services
npx supabase start

# This will:
# - Start PostgreSQL on port 15432
# - Start PostgREST API on port 15431
# - Start Supabase Studio on port 15434
# - Run initial migrations
```

### 3. Get Connection Details

```bash
npx supabase status
```

Output will show:
```
API URL: http://127.0.0.1:15431
DB URL: postgresql://postgres:postgres@127.0.0.1:15432/postgres
Studio URL: http://127.0.0.1:15434
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### 4. Configure Environment Variables

Create or update `.env` file:

```bash
SUPABASE_URL=http://127.0.0.1:15431
SUPABASE_KEY=<copy-anon-key-from-supabase-status>
```

### 5. Access Supabase Studio

Open http://127.0.0.1:15434 in your browser to:
- View database tables
- Run SQL queries
- Manage users
- View API logs
- Test RLS policies

## Common Commands

```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# Restart Supabase
npx supabase restart

# Check status
npx supabase status

# Reset database (WARNING: deletes all data)
npx supabase db reset

# Create new migration
npx supabase migration new <migration_name>

# Check for schema differences
npx supabase db diff

# View logs
npx supabase logs
```

## Database Schema

Current migrations:
- `20260115200500_create_flashcards_schema.sql` - Creates flashcards, generations, and error log tables

View migrations in: `supabase/migrations/`

## Troubleshooting

### Issue: Port already in use

**Error:** `Error: Port 15431 is already in use`

**Solution:**
```bash
# Stop Supabase
npx supabase stop

# If that doesn't work, find and kill the process
# On Windows:
netstat -ano | findstr :15431
taskkill /PID <process_id> /F

# On Linux/Mac:
lsof -ti:15431 | xargs kill -9

# Then start again
npx supabase start
```

### Issue: Cannot connect to database

**Error:** `Error connecting to database`

**Solutions:**
1. Check if Supabase is running: `npx supabase status`
2. Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
3. Restart Supabase: `npx supabase restart`
4. Check Docker is running (Supabase uses Docker)

### Issue: Migrations not applied

**Error:** `relation "generations" does not exist`

**Solution:**
```bash
# Reset database and re-apply migrations
npx supabase db reset

# Or manually apply migrations
npx supabase migration up
```

### Issue: anon key expired or invalid

**Solution:**
```bash
# Get fresh keys
npx supabase status

# Update .env with new anon key
```

## Production vs Local

### Local Development
- Uses ports 15431-15435
- Data is stored in Docker volumes
- `DEFAULT_USER_ID` is used (no auth)
- Studio available at http://127.0.0.1:15434

### Production (Future)
- Uses Supabase Cloud
- Real authentication enabled
- Different URL and keys
- Studio available on Supabase Dashboard

## Security Notes

### Local Development
- Default credentials: `postgres/postgres`
- anon key is for testing only
- service_role key has full access
- **Never commit `.env` file**

### Production (When deployed)
- Use environment-specific keys
- Enable Row Level Security (RLS)
- Rotate keys regularly
- Use service_role key only on server

## Database Access

### Via Supabase Studio
1. Open http://127.0.0.1:15434
2. Navigate to "Table Editor"
3. Select table (e.g., "generations")
4. View/edit data

### Via psql
```bash
psql postgresql://postgres:postgres@127.0.0.1:15432/postgres
```

### Via Supabase Client (in code)
```typescript
import { supabaseClient } from './db/supabase.client';

const { data, error } = await supabaseClient
  .from('generations')
  .select('*')
  .limit(10);
```

## Backup and Restore

### Backup
```bash
# Backup schema and data
npx supabase db dump -f backup.sql

# Backup schema only
npx supabase db dump --schema-only -f schema.sql

# Backup data only
npx supabase db dump --data-only -f data.sql
```

### Restore
```bash
# Restore from backup
psql postgresql://postgres:postgres@127.0.0.1:15432/postgres < backup.sql
```

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Supabase Configuration Reference](https://supabase.com/docs/guides/local-development/cli/config)
- Project Config: `supabase/config.toml`
