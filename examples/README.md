# HWCA MCP Server Examples

This directory contains example configurations and usage patterns for the HWCA MCP Server.

## Claude Desktop Configuration

### Windows Configuration
```json
{
  "mcpServers": {
    "hwca-automation": {
      "command": "node",
      "args": ["C:\\full\\path\\to\\hwca-mcp\\build\\index.js"]
    }
  }
}
```

### macOS/Linux Configuration
```json
{
  "mcpServers": {
    "hwca-automation": {
      "command": "node",
      "args": ["/full/path/to/hwca-mcp/build/index.js"]
    }
  }
}
```

## Example Commands

### Execute System Commands
```
Ask Claude: "List all files in my home directory"
Tool used: execute_command with command="ls" (or "dir" on Windows)
```

### File Operations
```
Ask Claude: "Read the contents of config.txt in my Documents folder"
Tool used: read_file with appropriate file path

Ask Claude: "Create a new file called notes.txt with some content"
Tool used: write_file with content and createDirectories=true
```

### System Monitoring
```
Ask Claude: "Show me system information"
Tool used: get_system_info

Ask Claude: "What processes are running?"
Tool used: list_processes

Ask Claude: "Kill process with ID 1234"
Tool used: kill_process with processId=1234
```

### Directory Management
```
Ask Claude: "Show me what's in the current directory"
Tool used: list_directory with current path

Ask Claude: "Show all files including hidden ones in /tmp"
Tool used: list_directory with includeHidden=true
```

## Security Notes

- Always review commands before execution
- Be cautious with file operations
- Monitor process termination operations
- Use in trusted environments only
