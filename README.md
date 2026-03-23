# Gmail MCP Server

An MCP server to interact with your Gmail account.

## Setup Instructions

1. **Install dependencies and build:**
   ```bash
   cd /home/nima/applier/tools/gmail-mcp-server
   npm install
   npm run build
   ```

2. **Generate your Token:**
   Run the following auth script. It will provide a URL for you to visit, log in, and then paste the code back into the terminal.
   ```bash
   npm run auth /home/nima/applier/client_secret_YOURS.json token.json
   ```

3. **Configure the Agent:**
   Use the following configuration snippet in your MCP setup:
   ```json
   "gmail": {
     "command": "node",
     "args": [
       "/home/nima/applier/tools/gmail-mcp-server/dist/index.js",
       "--credentials=/home/nima/applier/client_secret_YOURS.json",
       "--token=/home/nima/applier/tools/gmail-mcp-server/token.json",
       "--allow-delete=false"
     ]
   }
   ```
   > **Note:** Set `--allow-delete=true` only if you explicitly want the agent to be able to delete emails.
