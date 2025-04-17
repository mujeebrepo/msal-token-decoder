// app.js
require('dotenv').config();
const express = require('express');
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;

// MSAL configuration for v2.0 endpoints
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    // Explicitly specify v2.0 in the authority URL
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`,
    clientSecret: process.env.CLIENT_SECRET,
    // Force MSAL to use v2.0 endpoints
    protocolMode: "AAD" // AAD v2.0
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};

// Initialize MSAL application
const cca = new msal.ConfidentialClientApplication(msalConfig);

// Configure express
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index', { isAuthenticated: false });
});

app.get('/login', (req, res) => {
  // Generate the auth code URL
  const authCodeUrlParameters = {
    scopes: ["user.read", "openid", "profile", "email", "GroupMember.Read.All"],
    redirectUri: `http://localhost:${port}/redirect`
  };

  cca.getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      res.redirect(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get('/redirect', (req, res) => {
  // Exchange auth code for tokens
  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read", "openid", "profile", "email", "GroupMember.Read.All"],
    redirectUri: `http://localhost:${port}/redirect`
  };

  cca.acquireTokenByCode(tokenRequest)
    .then((response) => {
      // Log token information for debugging
      console.log("Token acquired successfully");
      
      // Decode the tokens
      const decodedIdToken = jwt.decode(response.idToken, { complete: true });
      const decodedAccessToken = jwt.decode(response.accessToken, { complete: true });
      
      // Extract user information
      const user = {
        name: response.account.name,
        username: response.account.username
      };
      
      // Check for group claims in both tokens
      const groupsFromIdToken = decodedIdToken.payload.groups || [];
      const groupsFromAccessToken = decodedAccessToken.payload.groups || [];
      
      // Combine groups from both tokens (removing duplicates)
      const allGroups = [...new Set([...groupsFromIdToken, ...groupsFromAccessToken])];
      const hasGroupClaim = allGroups.length > 0;
      
      // Log token details for debugging
      console.log('Access Token Version:', decodedAccessToken.payload.ver);
      console.log('ID Token Version:', decodedIdToken.payload.ver);
      console.log('Groups in ID token:', groupsFromIdToken.length);
      console.log('Groups in Access token:', groupsFromAccessToken.length);
      
      res.render('profile', {
        isAuthenticated: true,
        user: user,
        token: {
          accessToken: response.accessToken,
          idToken: response.idToken,
          decodedAccessToken: JSON.stringify(decodedAccessToken.payload, null, 2),
          decodedIdToken: JSON.stringify(decodedIdToken.payload, null, 2)
        },
        hasGroupClaim: hasGroupClaim,
        groups: allGroups
      });
    })
    .catch((error) => {
      console.log("Error acquiring token:", error);
      res.status(500).send(error);
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Using MSAL with v2.0 endpoints for token acquisition`);
});