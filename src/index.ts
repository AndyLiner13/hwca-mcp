#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import { readdir, readFile, writeFile, mkdir, access, constants } from "fs/promises";
import { join, dirname, extname } from "path";
import os from "os";

const execAsync = promisify(exec);

// Server configuration
const SERVER_INFO = {
  name: "hwca-mcp-server",
  version: "1.0.0",
};

// Create server instance
const server = new McpServer(
  {
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Input validation schemas using Zod
const executeCommandSchema = z.object({
  command: z.string().describe("The command to execute"),
  args: z.array(z.string()).optional().describe("Command arguments"),
  workingDirectory: z.string().optional().describe("Working directory for command execution"),
});

const readFileSchema = z.object({
  filePath: z.string().describe("Path to the file to read"),
});

const writeFileSchema = z.object({
  filePath: z.string().describe("Path to the file to write"),
  content: z.string().describe("Content to write to the file"),
  createDirectories: z.boolean().optional().default(false).describe("Create parent directories if they don't exist"),
});

const listDirectorySchema = z.object({
  directoryPath: z.string().describe("Path to the directory to list"),
  includeHidden: z.boolean().optional().default(false).describe("Include hidden files and directories"),
});

const getSystemInfoSchema = z.object({});

const processListSchema = z.object({
  filterBy: z.string().optional().describe("Filter processes by name (partial match)"),
});

const killProcessSchema = z.object({
  processId: z.number().describe("Process ID to terminate"),
  force: z.boolean().optional().default(false).describe("Force kill the process"),
});

// Helper functions
function getSystemCommand(command: string, args: string[] = []): { cmd: string; cmdArgs: string[] } {
  const platform = os.platform();
  
  if (platform === "win32") {
    // Windows
    return {
      cmd: "powershell.exe",
      cmdArgs: ["-Command", command, ...args]
    };
  } else {
    // Unix-like systems (Linux, macOS)
    return {
      cmd: command,
      cmdArgs: args
    };
  }
}

async function executeSystemCommand(command: string, args: string[] = [], workingDir?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { cmd, cmdArgs } = getSystemCommand(command, args);
    
    const process = spawn(cmd, cmdArgs, {
      cwd: workingDir || os.homedir(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Tool implementations
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "execute_command",
        description: "Execute a system command with optional arguments and working directory",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The command to execute"
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "Command arguments"
            },
            workingDirectory: {
              type: "string",
              description: "Working directory for command execution"
            }
          },
          required: ["command"],
        },
      },
      {
        name: "read_file",
        description: "Read the contents of a file",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Path to the file to read"
            }
          },
          required: ["filePath"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file, optionally creating parent directories",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Path to the file to write"
            },
            content: {
              type: "string",
              description: "Content to write to the file"
            },
            createDirectories: {
              type: "boolean",
              description: "Create parent directories if they don't exist",
              default: false
            }
          },
          required: ["filePath", "content"],
        },
      },
      {
        name: "list_directory",
        description: "List the contents of a directory",
        inputSchema: {
          type: "object",
          properties: {
            directoryPath: {
              type: "string",
              description: "Path to the directory to list"
            },
            includeHidden: {
              type: "boolean",
              description: "Include hidden files and directories",
              default: false
            }
          },
          required: ["directoryPath"],
        },
      },
      {
        name: "get_system_info",
        description: "Get information about the current system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_processes",
        description: "List running processes, optionally filtered by name",
        inputSchema: {
          type: "object",
          properties: {
            filterBy: {
              type: "string",
              description: "Filter processes by name (partial match)"
            }
          },
        },
      },
      {
        name: "kill_process",
        description: "Terminate a process by its ID",
        inputSchema: {
          type: "object",
          properties: {
            processId: {
              type: "number",
              description: "Process ID to terminate"
            },
            force: {
              type: "boolean",
              description: "Force kill the process",
              default: false
            }
          },
          required: ["processId"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "execute_command": {
        const { command, args: cmdArgs = [], workingDirectory } = executeCommandSchema.parse(args);
        const result = await executeSystemCommand(command, cmdArgs, workingDirectory);
        
        return {
          content: [
            {
              type: "text",
              text: `Command: ${command} ${cmdArgs.join(' ')}\nOutput:\n${result}`,
            },
          ],
        };
      }

      case "read_file": {
        const { filePath } = readFileSchema.parse(args);
        
        try {
          await access(filePath, constants.R_OK);
          const content = await readFile(filePath, 'utf-8');
          
          return {
            content: [
              {
                type: "text",
                text: `File: ${filePath}\n\n${content}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error reading file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }

      case "write_file": {
        const { filePath, content, createDirectories } = writeFileSchema.parse(args);
        
        try {
          if (createDirectories) {
            const dir = dirname(filePath);
            await mkdir(dir, { recursive: true });
          }
          
          await writeFile(filePath, content, 'utf-8');
          
          return {
            content: [
              {
                type: "text",
                text: `Successfully wrote ${content.length} characters to ${filePath}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error writing file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }

      case "list_directory": {
        const { directoryPath, includeHidden } = listDirectorySchema.parse(args);
        
        try {
          const items = await readdir(directoryPath, { withFileTypes: true });
          const filteredItems = includeHidden ? items : items.filter(item => !item.name.startsWith('.'));
          
          const itemList = filteredItems.map(item => {
            const type = item.isDirectory() ? 'DIR' : 'FILE';
            return `${type}: ${item.name}`;
          }).join('\n');
          
          return {
            content: [
              {
                type: "text",
                text: `Directory: ${directoryPath}\n\n${itemList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error listing directory ${directoryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }

      case "get_system_info": {
        getSystemInfoSchema.parse(args);
        
        const info = {
          platform: os.platform(),
          architecture: os.arch(),
          hostname: os.hostname(),
          release: os.release(),
          uptime: `${Math.floor(os.uptime() / 3600)} hours`,
          totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
          freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
          cpuCount: os.cpus().length,
          homeDirectory: os.homedir(),
          tmpDirectory: os.tmpdir(),
        };
        
        const infoText = Object.entries(info)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        
        return {
          content: [
            {
              type: "text",
              text: `System Information:\n\n${infoText}`,
            },
          ],
        };
      }

      case "list_processes": {
        const { filterBy } = processListSchema.parse(args);
        
        try {
          let command: string;
          
          if (os.platform() === "win32") {
            command = "Get-Process";
            if (filterBy) {
              command += ` | Where-Object { $_.ProcessName -like "*${filterBy}*" }`;
            }
            command += " | Select-Object Id, ProcessName, CPU, WorkingSet | Format-Table -AutoSize";
          } else {
            command = "ps aux";
            if (filterBy) {
              command += ` | grep -i "${filterBy}"`;
            }
          }
          
          const result = await executeSystemCommand(command);
          
          return {
            content: [
              {
                type: "text",
                text: `Running Processes${filterBy ? ` (filtered by: ${filterBy})` : ''}:\n\n${result}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error listing processes: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }

      case "kill_process": {
        const { processId, force } = killProcessSchema.parse(args);
        
        try {
          let command: string;
          
          if (os.platform() === "win32") {
            command = force ? `Stop-Process -Id ${processId} -Force` : `Stop-Process -Id ${processId}`;
          } else {
            command = force ? `kill -9 ${processId}` : `kill ${processId}`;
          }
          
          await executeSystemCommand(command);
          
          return {
            content: [
              {
                type: "text",
                text: `Successfully ${force ? 'force ' : ''}killed process ${processId}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error killing process ${processId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

// Resource handlers
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "hwca://system/info",
        name: "System Information",
        description: "Current system information and status",
        mimeType: "text/plain",
      },
      {
        uri: "hwca://system/processes",
        name: "Running Processes",
        description: "List of currently running processes",
        mimeType: "text/plain",
      },
    ],
  };
});

server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "hwca://system/info": {
      const info = {
        platform: os.platform(),
        architecture: os.arch(),
        hostname: os.hostname(),
        release: os.release(),
        uptime: `${Math.floor(os.uptime() / 3600)} hours`,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
        cpuCount: os.cpus().length,
        homeDirectory: os.homedir(),
        tmpDirectory: os.tmpdir(),
      };
      
      const infoText = Object.entries(info)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `System Information:\n\n${infoText}`,
          },
        ],
      };
    }

    case "hwca://system/processes": {
      try {
        let command: string;
        
        if (os.platform() === "win32") {
          command = "Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet | Format-Table -AutoSize";
        } else {
          command = "ps aux";
        }
        
        const result = await executeSystemCommand(command);
        
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: `Running Processes:\n\n${result}`,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: `Error retrieving processes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // This error message goes to stderr, so it won't interfere with the JSON-RPC communication
  console.error("HWCA MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
