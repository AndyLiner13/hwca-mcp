w# HWCA MCP Server

Welcome to the Home and Work Computer Automation (HWCA) MCP Server! This server enables AI assistants to safely interact with your computer through the Model Context Protocol.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Configure Claude Desktop:**
   Add to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "hwca": {
         "command": "node",
         "args": ["/absolute/path/to/hwca-mcp/build/index.js"]
       }
     }
   }
   ```

## Features

### 🛠️ System Automation Tools
- Execute system commands safely
- Manage files and directories
- Monitor system processes
- Get comprehensive system information

### 📊 System Resources
- Real-time system status
- Process monitoring
- Cross-platform compatibility (Windows, macOS, Linux)

### 🔒 Security Features
- Input validation with Zod schemas
- Platform-aware command execution
- Error handling and logging

## Architecture

This MCP server follows the Model Context Protocol specification and provides:
- **Tools**: Interactive functions that AI can call
- **Resources**: Static information sources
- **Cross-platform support**: Automatic platform detection and command adaptation

## Contributing

We welcome contributions! Please see our [GitHub repository](https://github.com/AndyLiner13/hwca-mcp) for more information.

## License

MIT License - see LICENSE file for details.
