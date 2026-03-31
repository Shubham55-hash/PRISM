# Autofill Feature - Testing Guide

## Overview

The autofill feature allows external applications and forms to automatically fetch your verified data from PRISM without requiring you to manually fill in form fields.

## Complete Testing Workflow

### Phase 1: Prepare Your Data (Backend)

1. **Upload & Verify Documents**
   - Go to **Documents** page
   - Upload identity, address, financial, education documents, etc.
   - Wait for verification (they'll have a ✓ checkmark)
   - This populates your autofill data vault with OCR-extracted information

2. **Check Available Data**
   - Go to **Smart Autofill** page
   - Look at **"Your Autofill Data Vault"** section
   - This shows all fields that will be available for autofill
   - If empty, verify some documents first

### Phase 2: Create an Autofill Token (Dashboard)

1. **Navigate to Smart Autofill**
   - Click **"Smart Autofill"** in sidebar
   - Scroll to **"Active Tokens"** section

2. **Create a New Token**
   - Click **"New Token"** button (top right)
   - Fill in the form:
     - **App/Website Name**: e.g., "Test Form", "Loan Portal", "Job Application"
     - **Purpose**: e.g., "KYC verification for testing"
     - **Fields to Share**: Select which fields the app can access
       - Click category headers to select all fields in that group
       - Or manually select individual fields
     - **Token Expiry**: Set a date (tomorrow or next week for testing)

3. **Copy the Token**
   - Click "Generate Autofill Token"
   - A modal shows the token (UUID format)
   - **Important**: Click "Copy" - you won't see it fully again!
   - Store it safely for this test

### Phase 3: Test with the Test Form

1. **Go to Test Autofill Page**
   - Click **"Test Autofill"** in sidebar
   - You'll see a form with an empty application form

2. **Paste Your Token**
   - In "Step 1: Paste Your Token", paste the token you created
   - You can see/hide the token with the eye icon

3. **Click "Fetch & Autofill"**
   - The form calls the backend: `GET /api/autofill/fetch/<token>`
   - Waits for response with your authorized fields
   - Form auto-populates with your PRISM data

4. **Verify Results**
   - Fields should be filled with your data
   - You'll see a success message showing how many fields were fetched
   - Success message shows token expiry date
   - Check the **"Fetched Fields"** sidebar for details

5. **Edit & Submit**
   - You can edit any prefilled field
   - Click "Submit Application" (simulates form submission)
   - This demonstrates a complete autofill workflow

### Phase 4: Manage & Revoke Tokens

1. **Monitor Token Usage**
   - Go back to **Smart Autofill** page
   - In **"Active Tokens"** section:
     - Shows # of times each token was used
     - Shows last access time
     - Days until expiry (warning if <7 days)

2. **Revoke Access**
   - Click "Revoke Access" button on any token
   - Token becomes "Revoked" immediately
   - Next fetch attempt with that token fails
   - App loses all access

3. **Check Revoked Tokens**
   - Scroll down to **"Revoked / Expired"** section
   - See all inactive tokens for reference

---

## What's Actually Happening

### Request Flow

```
1. User creates token in PRISM Dashboard
   └─ Specifies: appName, purpose, allowedFields, expiresAt
   └─ Backend creates unique consentToken (UUID)

2. User pastes token into Test Form
   └─ Frontend sends: GET /api/autofill/fetch/<token>

3. Backend validates token
   ├─ Checks if token exists
   ├─ Checks if active (not revoked/expired)
   ├─ Checks expiration date
   └─ Processes only if [AUTOFILL] purpose

4. Backend builds filtered profile
   ├─ Gets user's basic profile (name, email, phone, etc.)
   ├─ Extracts OCR data from verified documents
   ├─ Filters to only allowedFields
   └─ Returns sanitized data

5. Frontend populates form fields
   └─ Maps response data to form inputs
```

### Data Sources

**Field values come from:**
- **Base profile**: User registration info (name, email, phone, DOB, address, city, state, prismId, abhaId)
- **Identity documents**: Aadhaar, PAN, Passport numbers, gender, DOB
- **Address documents**: Street address, pincode, city, state
- **Financial documents**: Bank account, IFSC code, annual income
- **Education documents**: Institution, degree, graduation year
- **Employment documents**: Employer, designation
- **Medical documents**: Blood group

---

## Testing Scenarios

### ✅ Successful Test
1. Create token with fields: fullName, email, phone, address
2. Go to Test Form
3. Paste token
4. Click "Fetch & Autofill"
5. **Result**: Form shows your name, email, phone, and address

### ❌ Token Expired
1. Create token with expiry date = today
2. Wait for date to pass (or set past date)
3. Go to Test Form
4. Paste token
5. Click "Fetch & Autofill"
6. **Result**: Error message: "Token has expired"

### ❌ Token Revoked
1. Create token
2. Go to Smart Autofill page
3. Click "Revoke Access"
4. Go to Test Form
5. Paste token
6. Click "Fetch & Autofill"
7. **Result**: Error message: "Token is revoked"

### ❌ Invalid Token
1. Go to Test Form
2. Paste random UUID
3. Click "Fetch & Autofill"
4. **Result**: Error message: "Invalid autofill token"

### ⚠️ Limited Fields
1. Create token with only: fullName, email, phone (not address)
2. Go to Test Form
3. Paste token
4. Click "Fetch & Autofill"
5. **Result**: Only those 3 fields are populated; address stays empty

---

## API Reference (For Developers)

### Get User's Autofill Profile (Authenticated)
```bash
GET /api/autofill/profile
Authorization: Bearer <user_token>

Response: { success: true, data: { fullName, email, phone, ... } }
```

### Create Token (Authenticated)
```bash
POST /api/autofill/token
Authorization: Bearer <user_token>

Body: {
  "appName": "External App Name",
  "purpose": "KYC verification",
  "allowedFields": ["fullName", "email", "phone"],
  "expiresAt": "2026-04-30T23:59:59Z"
}

Response: {
  "success": true,
  "data": {
    "consentToken": "550e8400-e29b-41d4-a716-446655440000",
    "consent": { id, userId, institutionName, ... }
  }
}
```

### Fetch Autofill Data (Public - No Auth!)
```bash
GET /api/autofill/fetch/<token>

Response: {
  "success": true,
  "source": "PRISM Identity Vault",
  "appName": "External App Name",
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9999999999"
  },
  "meta": {
    "fieldsCount": 3,
    "expiresAt": "2026-04-30T23:59:59Z",
    "accessCount": 5
  }
}
```

### List Tokens (Authenticated)
```bash
GET /api/autofill/tokens
Authorization: Bearer <user_token>

Response: { 
  "success": true, 
  "data": [
    { id, institutionName, purpose, allowedFields, status, accessCount, ... },
    ...
  ] 
}
```

### Revoke Token (Authenticated)
```bash
PATCH /api/autofill/tokens/<id>/revoke
Authorization: Bearer <user_token>

Response: { success: true, message: "Autofill token revoked", data: { ... } }
```

---

## Common Issues & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Form fields stay empty | No verified documents | Upload documents and verify them first |
| "Invalid token" error | Wrong token format | Copy token directly from PRISM dashboard |
| "Token expired" error | Token past expiry date | Create a new token with future expiry date |
| Some fields missing | Token created with limited fields | Create new token and select more fields |
| "This token is not autofill" | Using a regular consent token | Use token created in Smart Autofill section |
| Form doesn't auto-populate | CORS issues | Check browser console for network errors |

---

## Security Features

✅ **Token is a UUID** - Random, not predictable
✅ **Tokens are one-time-display** - Only shown once for security
✅ **Field-level access control** - You decide what each app sees
✅ **Time-limited tokens** - Auto-expire on set date
✅ **Instant revocation** - Revoked tokens stop working immediately
✅ **Access logging** - Every fetch is logged with IP address
✅ **Encrypted data** - All documents securely stored
✅ **No hardcoded credentials** - Token system is stateless

---

## Next Steps

- **Try the test form** with different field combinations
- **Monitor token usage** in Smart Autofill dashboard
- **Test revocation** workflow
- **Integrate your own app** with PRISM using the public API endpoint
- **Check activity logs** to see all autofill access attempts
