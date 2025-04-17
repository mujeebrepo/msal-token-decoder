# MSAL Token Decoder for Entra ID Groups

A Node.js application that authenticates users with Microsoft Entra ID (formerly Azure AD) and decodes the ID token to verify if group claims (**GroupIDs or GroupNames**) are being properly transmitted.

## Features

- Authenticate users with Microsoft Entra ID
- Decode JWT access tokens to inspect claims
- Specifically check for and display group claims in the token
- Fetch group claims as either **GroupIDs or GroupNames** (for Cloud/Entra Native Groups)
- Simple web interface to view decoded token data

## Prerequisites

- Node.js (v14 or newer)
- NPM (v6 or newer)
- Microsoft Entra ID tenant with administrative access
- Groups configured in your Entra ID tenant

## Setup Instructions

### 1. Create Project Structure

```
msal-token-decoder/
├── app.js
├── .env
├── package.json
├── public/
└── views/
    ├── index.ejs
    └── profile.ejs
```

### 2. Register an Application in Entra ID

1. Go to the [Azure Portal](https://portal.azure.com) or directly visit [Entra ID](https://entra.microsoft.com)
2. Navigate to "Microsoft Entra ID" (formerly Azure Active Directory)
3. Go to "App registrations" and select "New registration"
4. Provide a name for your application
5. Set the redirect URI to `http://localhost:3000/redirect`
6. Select "Register"

### 3. Configure Group Claims

1. In your registered app, go to "Token configuration"
2. Click on "Add groups claim"
3. Select the appropriate options:
   - For security groups: "Security groups"
   - For Microsoft 365 groups: "Groups assigned to the application"
   - For all groups: "All groups (includes distribution lists but not groups assigned to the application)"
4. Choose whether you want the groups to be represented by:
   - Object ID
   - SIDs (Security Identifiers)
   - Display names
5. Make sure to include the claim in both Access and ID 
6. By default with the above configuration GroupIDs will be returned in Group Claims of ID token.To retrieve Cloud/Entra Native Group Names in the Claim instead of Group ID modify the App Manifest File
   - Goto App registrations -> (Application) -> Manage -> Manifest
   - Search for "optionalClaims" property and replace the "idToken" property as follows
   ```
   "idtoken": [
        {
            "additionalProperties" : [
                "cloud_displayname"
            ],
            "essential": false,
            "name": "groups",
            "source": null
        }
   ]
   ```   


### 4. Get Application Credentials

1. From your app registration, note down:
   - Application (client) ID
   - Directory (tenant) ID
2. Create a client secret:
   - Go to "Certificates & secrets"
   - Click "New client secret", provide a description and expiration
   - Copy the secret value immediately (you won't be able to see it again)

### 5. Update the .env File

Create a `.env` file in the root directory with the following content:

```
CLIENT_ID=your_client_id_from_step_4
TENANT_ID=your_tenant_id_from_step_4
CLIENT_SECRET=your_client_secret_from_step_4
PORT=3000
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Application

```bash
npm start
```

### 8. Test the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. After authentication, you'll see the decoded token with group claims if configured properly

## Troubleshooting Group Claims

If your groups aren't showing up in the token claims, check the following:

1. Verify you've configured the application to include group claims as described in step 3
2. Confirm the authenticated user is actually a member of the groups
3. Check that you have the necessary permissions configured in your app registration
4. Ensure you're using the appropriate scopes during authentication
5. For large numbers of groups, Microsoft may use the `_claim_names` and `_claim_sources` properties to reference groups rather than including them directly in the token

## Security Considerations

This application is for demonstration purposes only. In a production environment:

1. Always validate tokens using the appropriate signature verification
2. Store secrets securely and never commit them to source control
3. Use HTTPS for all communications
4. Implement proper error handling and logging
5. Consider implementing refresh token flows for better user experience

## License
MIT