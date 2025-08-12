---
applyTo: '**'
---
# Universal Project Guidelines

These rules are the foundation for all work done in this repository and apply universally, regardless of the active chat mode.

## 🛡️ Core Safety Protocols
- **NEVER Reset Database**: Under no circumstances suggest resetting the Supabase database or using `supabase db reset`.
- **Strict Read-Only Database Access**: All database interactions must be strictly read-only and must use the `supabaseTools` toolset. Never suggest or write `INSERT`, `UPDATE`, `DELETE`, or other write operations.

## ✍️ Workflow & Code Generation
- **Ask Before Major Changes**: Always ask for direction before implementing significant architectural changes or installing new dependencies.
- **No Self-Testing**: Never write or run test files or scripts. If testing is needed, ask me to perform the test in production and report back.
- **No Unapproved File Creation**: Do not create or update any files, especially `.md` documentation files, unless explicitly requested.
- **Database Schema & Interactions**: Use the `supabaseTools` toolset for all database interactions. Anytime you need to update a database-related function, use MCP to check the database before making changes to ensure that you understand the schema and data structures.