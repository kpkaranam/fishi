export function getDockerfileTemplate(): string {
  return `# FISHI Sandbox Runtime
# Minimal Node.js image for agent execution
FROM node:22-slim

# Install git and common build tools
RUN apt-get update && apt-get install -y --no-install-recommends \\
    git \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Non-root user for additional safety
RUN groupadd -r fishi && useradd -r -g fishi -m fishi
USER fishi

# Default command
CMD ["node"]
`;
}
