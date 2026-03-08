---
description: Drizzle database migration and schema update workflow
---

# 🗄️ Database Migration & Schema Update Workflow

This workflow ensures that the database schema is updated using industry-standard Drizzle ORM practices. Every schema change MUST be accompanied by a generated migration SQL file to maintain consistency across local developers and production environments.

## ⚠️ Core Requirements

1. **Never** manually modify the `local.db` schema using external tools or SQL scripts.
2. **Always** use `drizzle-kit` to generate and apply changes.
3. Every field, table, or relation change in `src/lib/schema.ts` **must** have a corresponding migration file in `drizzle/`.

## 🛠️ Execution Steps

### 1. Update Schema

Modify `src/lib/schema.ts` to reflect the desired changes (new tables, columns, constraints).

### 2. Generate Migration File

// turbo
Run the following command to generate the SQL migration file:

```bash
npm run db:generate
```

**Verification:** Ensure a new `.sql` file appears in `drizzle/` or `prisma/migrations` (depending on current config, check `drizzle.config.ts`).

### 3. Apply to Local Database

// turbo
Run the following command to apply the generated migration to your local `local.db`:

```bash
npm run db:migrate
```

**Verification:** Check console output for "pushed" or "migrated" success messages.

### 4. Verify in Studio (Optional)

// turbo
Optionally open Drizzle Studio to inspect the changes:

```bash
npm run db:studio
```

## 🚨 Troubleshooting

- If there is a conflict between local and migration files, **DO NOT delete the migrations folder**.
- Use `npm run db:generate -- --custom` if complex logic is needed, but typically standard generation is sufficient.
