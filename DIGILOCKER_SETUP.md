# DigiLocker Integration Guide

This guide explains how to set up the DigiLocker OAuth integration for PRISM Autofill.

## What is DigiLocker?

[DigiLocker](https://digilocker.gov.in) is a digital document vault provided by the Government of India that allows citizens to store and share official documents in a secure manner. Documents like Aadhaar, PAN, Driving License, and other government-issued documents can be stored and retrieved via DigiLocker API.

## Architecture

The DigiLocker integration works as follows:

1. **User clicks "DigiLocker" button** in the Documents page
2. **Auth Initiation**: Frontend requests authorization URL from backend
3. **Popup Window**: User is redirected to DigiLocker login page in a new window
4. **OAuth Callback**: After successful authentication, DigiLocker redirects to our backend callback endpoint
5. **Token Storage**: Backend exchanges auth code for access token and stores it securely
6. **Document Selection**: Frontend fetches available documents from DigiLocker API
7. **Document Import**: User selects documents to import, backend downloads and stores them locally

## Prerequisites

### 1. DigiLocker Developer Account

You need to register as a developer and get OAuth credentials:

- Go to https://digilocker.meity.gov.in/register
- Register for a developer account
- Create an application
- Get your `Client ID` and `Client Secret`

### 2. Environment Variables

Add these to your `.env` file in the `api-gateway` directory:

```env
DIGILOCKER_CLIENT_ID=your_client_id_here
DIGILOCKER_CLIENT_SECRET=your_client_secret_here
DIGILOCKER_REDIRECT_URI=http://localhost:4000/api/documents/digilocker/callback
FRONTEND_URL=http://localhost:3000
```

For production:

```env
DIGILOCKER_CLIENT_ID=your_production_client_id
DIGILOCKER_CLIENT_SECRET=your_production_client_secret
DIGILOCKER_REDIRECT_URI=https://yourdomain.com/api/documents/digilocker/callback
FRONTEND_URL=https://yourdomain.com
```

## API Endpoints

### 1. Initiate Authorization
```
GET /api/documents/digilocker/authorize
```
Returns an authorization URL and state token. The frontend should open this URL in a popup window.

**Response:**
```json
{
  "authUrl": "https://digilocker.meity.gov.in/public/oauth2/1/authorize?client_id=...",
  "state": "uuid-token-for-csrf-protection"
}
```

### 2. OAuth Callback
```
GET /api/documents/digilocker/callback?code=AUTH_CODE&state=STATE_TOKEN
```
Handles the OAuth callback from DigiLocker. Exchanges the authorization code for an access token and stores it in the user record. Redirects back to the frontend with success/error status.

### 3. Fetch Available Documents
```
GET /api/documents/digilocker/documents
```
Fetches all documents available in the user's DigiLocker account.

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_id_1",
      "name": "Aadhaar Card",
      "type": "identity",
      "issuer": "Government of India",
      "issuedDate": "2020-01-15",
      "expiryDate": "2025-01-15"
    },
    ...
  ]
}
```

### 4. Import Selected Documents
```
POST /api/documents/import-digilocker
Content-Type: application/json

{
  "selectedDocIds": ["doc_id_1", "doc_id_2"]
}
```
Imports selected documents from DigiLocker into PRISM. Downloads the documents and stores them locally.

**Response:**
```json
{
  "success": true,
  "message": "Imported 2 documents from DigiLocker",
  "data": [
    {
      "id": "prism_doc_id_1",
      "name": "Aadhaar Card",
      "documentType": "identity",
      "uploadSource": "digilocker",
      ...
    }
  ]
}
```

## Frontend Usage

### Key Components

1. **DigiLockerModal** (`src/components/DigiLockerModal.tsx`)
   - Handles the auth flow in a modal dialog
   - Shows document selection UI
   - Manages imports

2. **Documents API** (`src/api/documents.ts`)
   - `initiateDigiLockerAuth()` - Start OAuth flow
   - `fetchDigiLockerDocuments()` - Get available docs
   - `importSelectedDigiLockerDocs()` - Import selected docs

### Example Usage

```typescript
// Open DigiLocker modal
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>
  Connect DigiLocker
</button>

<DigiLockerModal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(count) => {
    console.log(`Imported ${count} documents`);
  }}
  isConnected={userHasDigilocker}
/>
```

## DigiLocker Document Types

DigiLocker documents are mapped to PRISM document types as follows:

| DigiLocker Type | PRISM Type | Examples |
|---|---|---|
| Aadhaar, PAN, Passport, DL | identity | Aadhaar Card, PAN Certificate, Driving License |
| GSTIN, ESI, PF, NPS | financial | Tax documents, Insurance |
| Affidavit | legal | Legal documents |
| Utility Bill, Electricity | address | Address proof |
| Other | other | Miscellaneous |

## Security Considerations

1. **Token Storage**: Access tokens are stored in the User record in SQLite (development). For production, use:
   - Encrypted database fields
   - Separate secrets management service
   - Redis for temporary tokens

2. **State Token**: CSRF protection via state token that expires in 10 minutes

3. **Token Expiry**: Tokens from DigiLocker expire after a set period. The app checks expiry and logs the user out if expired.

4. **Refresh Tokens**: If DigiLocker provides refresh tokens, they can be used to get new access tokens without re-authentication.

## Troubleshooting

### "DigiLocker not connected" error
- User hasn't authorized the app yet
- Ask user to click "Connect DigiLocker" and complete the authentication flow

### "DigiLocker token expired" error
- The stored access token has expired
- User needs to re-authorize

### No documents in DigiLocker
- Verify user's DigiLocker account has documents
- Check DigiLocker website directly

### Callback redirect fails
- Verify `DIGILOCKER_REDIRECT_URI` matches the registered redirect URI in DigiLocker console
- Ensure `FRONTEND_URL` is correctly set

## Testing Without Real DigiLocker Credentials

For development/testing without real DigiLocker credentials, use the mock endpoint:

```
POST /api/documents/import-digilocker-mock
```

This immediately imports mock documents without requiring OAuth authentication.

## Future Enhancements

1. **Refresh Token Flow**: Implement automatic token refresh before expiry
2. **Document Categorization**: AI-powered detection of document types
3. **Batch Operations**: Import multiple documents in one action
4. **Webhook Notifications**: Real-time updates when documents are available
5. **Multi-Account**: Support multiple DigiLocker accounts per user
6. **Sync Scheduling**: Periodic sync of new documents from DigiLocker
