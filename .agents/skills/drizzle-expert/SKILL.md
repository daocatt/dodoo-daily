---
name: drizzle-expert
description: Enterprise-grade Drizzle ORM operations for production stability and data safety
---

# 🛡️ Drizzle Expert Skill (Industrial Usage)

This skill enforces strict, production-ready standards for managing Drizzle ORM to ensure data integrity, zero downtime, and a clean migration history in industrial/team-based projects.

## 🚨 CRITICAL PROTOCOLS (High-Voltage Lines)

### 🚫 NEVER DELETE OR SQUASH (严禁删除或压缩)
- **NEVER** delete existing `.sql` files in the migration directory (e.g., `src/lib/drizzle/*.sql`).
- **NEVER** modify or delete the `meta/` directory snapshots once they are checked into Git.
- **NEVER** squash/flatten migrations in a project with active data. This breaks the deployment path for other environments.

### 🚫 NO PUSH IN PRODUCTION (生产环境禁用 PUSH)
- `drizzle-kit push` is for RAPID LOCAL PROTOTYPING ONLY.
- **NEVER** use `push` in production or staging with live data. Always use `drizzle-kit generate` + `migrate`.

## 🛠️ INDUSTRIAL WORKFLOW

### 1. Schema Change (Schema 变更)
- **Additive First**: Prefer adding columns over renaming/deleting to avoid breaking existing services.
- **Nullable by Default**: When adding columns to large tables, always make them nullable or provide a default value.
- **Avoid NotNull on Active Tables**: Adding a `NOT NULL` column without a default to a table with rows will FAIL.

### 2. Migration Generation (生成迁移)
- Use `npx drizzle-kit generate --name <meaningful_name>`.
- **Pre-Review**: Always open and review the generated `.sql` file for:
  - Dangerous operations (e.g., `DROP COLUMN`).
  - Index performance impacts.
  - Correctness of foreign keys.

### 3. Data Safety (数据安全)
- **Shadow Columns**: If renaming a column (X -> Y), create column Y, backfill data, then drop X in a subsequent release.
- **Large Backfills**: Do not perform massive DB updates in the migration SQL itself. Use a separate script or background job to avoid locking the DB.

## 🚨 TROUBLESHOOTING DRIFT

If `generate` produces a full `0000_...sql` file instead of an incremental `00xx_...sql` file:
1. **DO NOT APPLY IT.**
2. Check if your `drizzle.config.ts` points to the correct `out` directory.
3. Check `git status` to see if `meta/*.json` files were deleted.
4. **Restore snapshots from Git** first before generating new migrations.

## 💡 PRODUCTION CHECKLIST
- [ ] Columns for `createdAt` and `updatedAt` follow the project standard.
- [ ] Foreign keys have indexes (FKs do NOT automatically create indexes in all DBs).
- [ ] Indexes use selective column order (most selective first).
- [ ] No `SELECT *` in production code; specify columns.
