export function getMcpJsonTemplate(): string {
  const config = {
    mcpServers: {
      github: {
        type: "http" as const,
        url: "https://api.githubcopilot.com/mcp/",
      },
      "sequential-thinking": {
        type: "stdio" as const,
        command: "npx",
        args: ["-y", "@anthropic/sequential-thinking-mcp"],
      },
      context7: {
        type: "stdio" as const,
        command: "npx",
        args: ["-y", "@anthropic/context7-mcp"],
      },
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}
