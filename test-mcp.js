import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs/promises";

async function main() {
  const credentialsPath = "/home/nima/applier/credential/gmail/client_secret_509167752951-omti5hpgmbogn65qgmq1r14hnc8mv30t.apps.googleusercontent.com.json";
  const tokenPath = "/home/nima/applier/credential/gmail/token.json";
  
  const transport = new StdioClientTransport({
    command: "node",
    args: [
      "/home/nima/applier/tools/gmail-mcp-server/dist/index.js",
      `--credentials=${credentialsPath}`,
      `--token=${tokenPath}`,
      "--allow-delete=false"
    ]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP server");

  // Read CV PDF
  const cvPath = "/home/nima/applier/workspace/myData/cv.pdf";
  const cvBuffer = await fs.readFile(cvPath);
  const cvBase64 = cvBuffer.toString("base64");

  // Create Cover Letter
  const coverLetterText = `Dear Hiring Manager,

I am writing to express my interest in the position of CEO of your space ship, as advertised.
My name is NIMA MALAYERI and I have an extensive background in Full Stack Web Development, AI Engineering, and MLOps. 
I have a passion for cutting-edge technology and scaling complex AI systems, which translates perfectly into leading a space ship's technological fleet.

Attached to this email, please find my CV for your review.

Sincerely,
Nima Malayeri`;

  const coverLetterBase64 = Buffer.from(coverLetterText).toString("base64");

  console.log("Calling create_draft...");
  const res = await client.callTool({
    name: "create_draft",
    arguments: {
      to: "example@example.com",
      subject: "Application for CEO of Your Space Ship",
      body: "I wanna apply for the position of CEO of your space ship\n\nPlease find my CV and Cover Letter attached.",
      attachments: [
        {
          filename: "cv.pdf",
          content: cvBase64,
          mimeType: "application/pdf"
        },
        {
          filename: "Cover_Letter.txt",
          content: coverLetterBase64,
          mimeType: "text/plain"
        }
      ]
    }
  });

  console.log("Result:", JSON.stringify(res, null, 2));
  process.exit(0);
}

main().catch(console.error);
