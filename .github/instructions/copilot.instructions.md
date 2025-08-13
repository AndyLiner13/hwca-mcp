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

---------------------------------

This CoPilot should be a Horizon Worlds scripting expert that understands all of the typescript documentation provided in the documentation folder.

The copilot.instructions.md file (this file) should include the necessary instructions for CoPilot to effectively assist with Horizon Worlds scripting tasks with 100% accuracy.

And the MCP server should be configured to provide all of the context tools necessary for CoPilot to function effectively. (using the Tool Sets file native to GitHub CoPilot for VS Code: C:\Users\conta\AppData\Roaming\Code\User\prompts\hwca-mcp.toolsets.jsonc)

CoPilot should only use the typescript syntax specifically mentioned in the documentation folder when helping with code. I want this instructions file to ensure that CoPilot doesn't write incompatible code and strictly adheres to the guidelines and syntax provided in the documenation files.

Please make it to where CoPilot can check any link from "https://developers.meta.com/horizon-worlds/learn/documentation/typescript" or the official Meta Developer Forums (https://communityforums.atmeta.com/category/developer) if it needs help solving problems that it doesn't think it can handle with the provided documentation (edge cases, etc.).