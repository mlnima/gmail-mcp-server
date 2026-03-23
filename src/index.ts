import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import * as fs from "fs/promises";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { GmailService } from "./gmail.js";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('credentials', {
      type: 'string',
      description: 'Path to client_secret.json',
      demandOption: true,
    })
    .option('token', {
      type: 'string',
      description: 'Path to token.json',
      demandOption: true,
    })
    .option('allow-delete', {
      type: 'boolean',
      description: 'Allow deleting emails',
      default: false,
    })
    .parse();

  const credentialsPath = argv.credentials;
  const tokenPath = argv.token;
  const allowDelete = argv["allow-delete"];

  const content = await fs.readFile(credentialsPath, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const tokenContent = await fs.readFile(tokenPath, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(tokenContent));
  } catch (err) {
    console.error(`Could not read token at ${tokenPath}. Please run the auth script first.`);
    process.exit(1);
  }

  const gmailService = new GmailService(oAuth2Client);

  const server = new Server(
    {
      name: "gmail-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [
      {
        name: "search_emails",
        description: "Search for emails in Gmail",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            maxResults: { type: "number" },
          },
          required: ["query"],
        },
      },
      {
        name: "read_email",
        description: "Read a specific email by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_draft",
        description: "Create a draft email",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  filename: { type: "string" },
                  content: { type: "string", description: "Base64 encoded content" },
                  mimeType: { type: "string" }
                },
                required: ["filename", "content", "mimeType"]
              }
            }
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "send_email",
        description: "Send an email immediately",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  filename: { type: "string" },
                  content: { type: "string", description: "Base64 encoded content" },
                  mimeType: { type: "string" }
                },
                required: ["filename", "content", "mimeType"]
              }
            }
          },
          required: ["to", "subject", "body"],
        },
      }
    ];

    if (allowDelete) {
      tools.push({
        name: "delete_email",
        description: "Move an email to the trash by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      });
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (request.params.name === "search_emails") {
        const { query, maxResults } = request.params.arguments as any;
        const res = await gmailService.searchEmails(query, maxResults);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      } else if (request.params.name === "read_email") {
        const { id } = request.params.arguments as any;
        const res = await gmailService.readEmail(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      } else if (request.params.name === "create_draft") {
        const { to, subject, body, attachments } = request.params.arguments as any;
        const res = await gmailService.createDraft(to, subject, body, attachments);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      } else if (request.params.name === "send_email") {
        const { to, subject, body, attachments } = request.params.arguments as any;
        const res = await gmailService.sendEmail(to, subject, body, attachments);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      } else if (request.params.name === "delete_email") {
        if (!allowDelete) {
          throw new Error("Delete email tool is disabled. Pass --allow-delete to enable.");
        }
        const { id } = request.params.arguments as any;
        const res = await gmailService.deleteEmail(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }
      throw new Error(`Tool not found: ${request.params.name}`);
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: error.message }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
