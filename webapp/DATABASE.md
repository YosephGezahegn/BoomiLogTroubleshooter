# Database Setup Guide

## Overview

This project uses PostgreSQL as the database and Prisma as the ORM.

## Database Schema

The schema includes the following models:

### Core Models
- **User** - User authentication and management
- **Analysis** - Stores analysis results (manual upload + API fetch)
- **BoomiConnection** - Boomi API credentials (encrypted)

### API Integration Models
- **ScheduledAnalysis** - Cron-based scheduled jobs
- **ApiUsageLog** - Track API calls and rate limits
- **ComponentCache** - Cache Boomi component metadata

### Supporting Models
- **Notification** - User notifications and emails
- **AuditLog** - Security and activity tracking

## Local Development Setup

### 1. Start PostgreSQL

**Via Homebrew:**
```bash
brew services start postgresql@14
```

**Via Docker:**
```bash
docker compose up -d
```

### 2. Create Database

```bash
createdb boomi_log_analyzer
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update `DATABASE_URL`:

```bash
# For local Homebrew PostgreSQL
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/boomi_log_analyzer?schema=public"

# For Docker PostgreSQL
DATABASE_URL="postgresql://boomi_admin:boomi_dev_password_2026@localhost:5432/boomi_log_analyzer?schema=public"
```

### 4. Run Migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

## Common Commands

### Database Management

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply existing migrations
npx prisma migrate deploy

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Schema Updates

```bash
# After modifying schema.prisma:
1. npx prisma format          # Format the schema
2. npx prisma migrate dev     # Create and apply migration
3. npx prisma generate        # Regenerate client
```

### Database URLs

```bash
# Generate Prisma Client
npx prisma generate

# View database
npx prisma studio

# Check migration status
npx prisma migrate status
```

## Production Setup

### 1. Set DATABASE_URL

```bash
# For Supabase/Railway/Heroku
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&sslmode=require"
```

### 2. Apply Migrations

```bash
npx prisma migrate deploy
```

### 3. Generate Client

```bash
npx prisma generate
```

## Troubleshooting

### Connection Refused

**Problem:** Can't connect to PostgreSQL  
**Solution:**
```bash
brew services start postgresql@14
pg_isready  # Check if running
```

### Permission Denied

**Problem:** User doesn't have access to database  
**Solution:**
```bash
# Update DATABASE_URL to use your system username
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/boomi_log_analyzer"
```

### Migration Conflicts

**Problem:** Migrations out of sync  
**Solution:**
```bash
# Option 1: Reset (destroys data)
npx prisma migrate reset

# Option 2: Resolve manually
npx prisma migrate resolve --applied <migration_name>
```

### Prisma Client Out of Sync

**Problem:** "Prisma Client is not adapted to your schema"  
**Solution:**
```bash
npx prisma generate
```

## Using Prisma in Code

### Import the Client

```typescript
import prisma from '@/lib/db';
```

### Basic Queries

```typescript
// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    name: 'John Doe',
  },
});

// Find user
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Create analysis (with relation)
const analysis = await prisma.analysis.create({
  data: {
    userId: user.id,
    fileName: 'ProcessLog_12345.log',
    fileSize: 1024000,
    sourceType: 'MANUAL_UPLOAD',
    summary: {
      duration: 3420000,
      totalShapes: 81934,
      documentsProcessed: 4359706,
    },
  },
});

// Query with relations
const userWithAnalyses = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    analyses: {
      orderBy: { analyzedAt: 'desc' },
      take: 10,
    },
  },
});
```

## Database Backup

### Local Backup

```bash
pg_dump -U YOUR_USERNAME boomi_log_analyzer > backup.sql
```

### Restore from Backup

```bash
psql -U YOUR_USERNAME boomi_log_analyzer < backup.sql
```

## Security Notes

1. **Never commit .env files** - Contains sensitive data
2. **Use strong passwords** - For production databases
3. **Encrypt API tokens** - Boomi tokens are encrypted in database
4. **Enable SSL** - For production connections
5. **Regular backups** - Automated backup strategy

## Database Indexes

The schema includes indexes on:
- `analyses.userId` - Fast user lookup
- `analyses.analyzedAt` - Date range queries
- `analyses.executionId` - Boomi execution lookup
- `scheduledAnalyses.nextRunAt` - Job scheduling
- `apiUsageLogs.createdAt` - Rate limit tracking

## JSON Fields

Several models use JSON for flexibility:

- `Analysis.summary` - Execution summary metrics
- `Analysis.topSlowShapes` - Performance data
- `Analysis.errorAnalysis` - Error details
- `Analysis.processFlow` - Flow diagram data
- `ComponentCache.metadata` - Cached component data

## Migrations Directory

```
prisma/
├── schema.prisma              # Database schema
└── migrations/
    └── 20260210114348_init/   # Initial migration
        └── migration.sql      # SQL commands
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js + Prisma Guide](https://www.prisma.io/nextjs)

---

**Last Updated:** February 10, 2026
