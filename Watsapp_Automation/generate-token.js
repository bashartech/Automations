const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

// Load credentials
const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf8'));
const { client_id, client_secret, redirect_uris } = credentials.installed;

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Define scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force to get refresh_token
});

console.log('🔐 Google OAuth2 Token Generator\n');
console.log('📋 Required Scopes:');
SCOPES.forEach(scope => console.log(`   - ${scope}`));
console.log('\n🌐 Authorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('📝 Enter the authorization code from the URL: ', async (code) => {
  rl.close();

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to token.json
    const tokenData = {
      token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_uri: 'https://oauth2.googleapis.com/token',
      client_id: client_id,
      client_secret: client_secret,
      scopes: SCOPES
    };

    fs.writeFileSync('./token.json', JSON.stringify(tokenData, null, 2));

    console.log('\n✅ Token saved to token.json');
    console.log('🚀 You can now start the bot with: npm start');

  } catch (error) {
    console.error('❌ Error retrieving access token:', error.message);
  }
});
