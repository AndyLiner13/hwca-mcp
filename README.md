# HWCA MCP Server

A Model Context Protocol (MCP) server for the Horizon Worlds editor. This server provides tools and resources for automating context-management tasks, enabling GitHub CoPilot to understand the context of the Horizon Worlds TypeScript APIs.

__*Be sure to add the corresponding Instructions and Tool Sets (provided in the .github folder) & copy their contents to your corresponding .github folder in your project's root directory.__

## Features

### Tools
- **execute_command** - Execute system commands with optional arguments and working directory
- **read_file** - Read the contents of files
- **write_file** - Write content to files with optional directory creation
- **list_directory** - List directory contents with optional hidden files
- **get_system_info** - Get comprehensive system information
- **list_processes** - List running processes with optional filtering
- **kill_process** - Terminate processes by ID with optional force flag

### Resources
- **hwca://system/info** - Current system information and status
- **hwca://system/processes** - List of currently running processes

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### With Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "hwca": {
      "command": "node",
      "args": ["/path/to/hwca-mcp/build/index.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "hwca": {
      "command": "node",
      "args": ["C:\\path\\to\\hwca-mcp\\build\\index.js"]
    }
  }
}
```

### Standalone Usage

You can also run the server directly:
```bash
npm start
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. For development with auto-rebuild:
   ```bash
   npm run dev
   ```

## Security Considerations

This MCP server provides powerful system access capabilities including:
- File system read/write operations
- System command execution
- Process management

**Important Security Notes:**
- Only use this server in trusted environments
- Be cautious when granting AI assistants access to system commands
- Review and understand any commands before execution
- Consider running in a sandboxed environment for production use

## Platform Support

This server supports:
- **Windows** (PowerShell commands)
- **macOS** (Unix commands)
- **Linux** (Unix commands)

Commands are automatically adapted based on the detected platform.

## Examples

### Execute a Command
```typescript
// List files in current directory
{
  "command": "ls",
  "args": ["-la"],
  "workingDirectory": "/home/user"
}
```

### Read a File
```typescript
{
  "filePath": "/path/to/file.txt"
}
```

### Write a File
```typescript
{
  "filePath": "/path/to/new/file.txt",
  "content": "Hello, World!",
  "createDirectories": true
}
```

### List Processes
```typescript
{
  "filterBy": "node"  // Optional filter
}
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.

