import { google } from 'googleapis';
import * as fs from 'fs/promises';
import * as readline from 'readline';

const SCOPES = ['https://mail.google.com/'];

async function main() {
  const credentialsPath = process.argv[2];
  const tokenPath = process.argv[3] || 'token.json';

  if (!credentialsPath) {
    console.error('Usage: node dist/auth.js <path-to-client-secret.json> [path-to-token.json]');
    process.exit(1);
  }

  const content = await fs.readFile(credentialsPath, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob');

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here (If the URL is broken by localhost, copy the "code=" parameter from your browser URL bar): ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      await fs.writeFile(tokenPath, JSON.stringify(tokens));
      console.log(`Token stored to ${tokenPath}`);
    } catch (err) {
      console.error('Error retrieving access token', err);
    }
  });
}

main().catch(console.error);
