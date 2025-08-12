#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import os from "os";

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

// Helper function to execute commands
function executeCommand(command: string, args: string[] = [], workingDirectory?: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Register tools
server.tool("execute_command", "Execute a system command", {
  command: z.string().describe("The command to execute"),
  args: z.array(z.string()).optional().describe("Command arguments")
}, async ({ command, args = [] }: { command: string; args?: string[] }) => {
  const isWindows = os.platform() === "win32";
  
  try {
    if (isWindows) {
      const powershellCommand = args.length > 0 ? `${command} ${args.join(" ")}` : command;
      const result = await executeCommand("powershell.exe", ["-Command", powershellCommand]);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              command: powershellCommand,
              platform: "windows",
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode
            }, null, 2)
          }
        ]
      };
    } else {
      const result = await executeCommand(command, args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              command: `${command} ${args.join(" ")}`,
              platform: "unix",
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode
            }, null, 2)
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            command: command,
            platform: isWindows ? "windows" : "unix"
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

server.tool("read_file", "Read the contents of a file", {
  path: z.string().describe("The file path to read")
}, async ({ path }: { path: string }) => {
  try {
    const content = await readFile(path, "utf-8");
    return {
      content: [
        {
          type: "text",
          text: `File: ${path}\n\n${content}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error reading file ${path}: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

server.tool("write_file", "Write content to a file", {
  path: z.string().describe("The file path to write to"),
  content: z.string().describe("The content to write")
}, async ({ path, content }: { path: string; content: string }) => {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
    return {
      content: [
        {
          type: "text",
          text: `Successfully wrote to file: ${path}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error writing file ${path}: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

server.tool("list_directory", "List the contents of a directory", {
  path: z.string().describe("The directory path to list")
}, async ({ path }: { path: string }) => {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file"
    }));
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            path: path,
            items: items
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing directory ${path}: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

server.tool("get_system_info", "Get comprehensive system information", {}, async () => {
  try {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times
      })),
      networkInterfaces: os.networkInterfaces(),
      userInfo: os.userInfo(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir()
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error getting system info: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

server.tool("list_processes", "List running processes", {}, async () => {
  const isWindows = os.platform() === "win32";
  
  try {
    let processes;
    if (isWindows) {
      const result = await executeCommand("powershell.exe", [
        "-Command",
        "Get-Process | Select-Object Name, Id, CPU, WorkingSet | ConvertTo-Json"
      ]);
      processes = JSON.parse(result.stdout);
    } else {
      const result = await executeCommand("ps", ["aux"]);
      const lines = result.stdout.split("\n").slice(1); // Skip header
      processes = lines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            user: parts[0],
            pid: parts[1],
            cpu: parts[2],
            mem: parts[3],
            command: parts.slice(10).join(" ")
          };
        });
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            platform: isWindows ? "windows" : "unix",
            processes: processes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing processes: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

server.tool("kill_process", "Terminate a process by PID", {
  pid: z.number().describe("The process ID to terminate")
}, async ({ pid }: { pid: number }) => {
  const isWindows = os.platform() === "win32";
  
  try {
    if (isWindows) {
      await executeCommand("taskkill", ["/F", "/PID", pid.toString()]);
    } else {
      await executeCommand("kill", [pid.toString()]);
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully terminated process ${pid}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error terminating process ${pid}: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

// Register resources
server.resource("system-info", "hwca://system/info", async () => {
  try {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed
      })),
      userInfo: os.userInfo(),
      homedir: os.homedir()
    };
    
    return {
      contents: [
        {
          uri: "hwca://system/info",
          mimeType: "application/json",
          text: JSON.stringify(info, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      contents: [
        {
          uri: "hwca://system/info",
          mimeType: "text/plain",
          text: `Error retrieving system information: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
});

server.resource("system-processes", "hwca://system/processes", async () => {
  try {
    const isWindows = os.platform() === "win32";
    let result: string;
    
    if (isWindows) {
      const commandResult = await executeCommand("powershell.exe", [
        "-Command",
        "Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet | Format-Table -AutoSize"
      ]);
      result = commandResult.stdout;
    } else {
      const commandResult = await executeCommand("ps", ["aux"]);
      result = commandResult.stdout;
    }
    
    return {
      contents: [
        {
          uri: "hwca://system/processes",
          mimeType: "text/plain",
          text: `Running Processes:\n\n${result}`
        }
      ]
    };
  } catch (error) {
    return {
      contents: [
        {
          uri: "hwca://system/processes",
          mimeType: "text/plain",
          text: `Error retrieving processes: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
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
