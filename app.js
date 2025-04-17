// app.js
require('dotenv').config();
const express = require('express');
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
    protocolMode: "AAD"
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
    scopes: ["user.read", "openid", "profile", "email"],
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
    scopes: ["user.read", "openid", "profile", "email"],
    redirectUri: `http://localhost:${port}/redirect`,
    tokenEndpoint: `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`
  };

  cca.acquireTokenByCode(tokenRequest)
    .then((response) => {
      // Decode the access token
      const decodedToken = decodeToken(response.accessToken);
      
      // Check for group claims
      const groups = decodedToken.groups || [];
      const hasGroupClaim = Array.isArray(groups) && groups.length > 0;

      res.render('profile', {
        isAuthenticated: true,
        user: response.account,
        token: {
          accessToken: response.accessToken,
          idToken: response.idToken,
          decoded: JSON.stringify(decodedToken, null, 2)
        },
        hasGroupClaim: hasGroupClaim,
        groups: groups
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

// Function to decode JWT token
function decodeToken(token) {
  try {
    // Note: This only decodes the token without verification
    const decoded = jwt.decode(token, { complete: true });
    return decoded.payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return { error: 'Failed to decode token' };
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});