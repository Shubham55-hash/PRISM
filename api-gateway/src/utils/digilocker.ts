import axios from 'axios';

// DigiLocker OAuth Configuration
const DIGILOCKER_CONFIG = {
  authorizationUrl: 'https://www.digilocker.gov.in/',
  tokenUrl: 'https://digilocker.gov.in/public/oauth2/1/token',
  apiUrl: 'https://digilocker.meity.gov.in/public/oauth2/1',
  clientId: process.env.DIGILOCKER_CLIENT_ID || 'your_client_id',
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET || 'your_client_secret',
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:4000/api/documents/digilocker/callback',
};

/**
 * Generate DigiLocker authorization URL
 */
export function generateDigiLockerAuthUrl(state: string): string {
  if (DIGILOCKER_CONFIG.clientId === 'your_client_id') {
    return DIGILOCKER_CONFIG.authorizationUrl;
  }
  const params = new URLSearchParams({
    client_id: DIGILOCKER_CONFIG.clientId,
    redirect_uri: DIGILOCKER_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'read',
    state,
  });
  return `${DIGILOCKER_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeAuthCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  try {
    const response = await axios.post(DIGILOCKER_CONFIG.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: DIGILOCKER_CONFIG.clientId,
      client_secret: DIGILOCKER_CONFIG.clientSecret,
      redirect_uri: DIGILOCKER_CONFIG.redirectUri,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in || 3600,
    };
  } catch (error: any) {
    console.error('DigiLocker token exchange failed:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code for access token');
  }
}

/**
 * Fetch available documents from DigiLocker
 */
export async function fetchDigiLockerDocuments(accessToken: string): Promise<any[]> {
  try {
    const response = await axios.get(`${DIGILOCKER_CONFIG.apiUrl}/docs/list`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // DigiLocker returns documents in different formats, normalize them
    const documents = response.data.documents || response.data.docs || [];
    return documents.map((doc: any) => ({
      id: doc.id || doc.docId,
      name: doc.docName || doc.name,
      type: doc.docType || 'other',
      issuer: doc.issuer || 'Government of India',
      issuedDate: doc.issuedDate,
      expiryDate: doc.expiryDate,
      url: doc.url || doc.docUrl,
      raw: doc,
    }));
  } catch (error: any) {
    console.error('Failed to fetch DigiLocker documents:', error.response?.data || error.message);
    throw new Error('Failed to fetch documents from DigiLocker');
  }
}

/**
 * Download document from DigiLocker
 */
export async function downloadDigiLockerDocument(accessToken: string, docId: string): Promise<Buffer> {
  try {
    const response = await axios.get(`${DIGILOCKER_CONFIG.apiUrl}/docs/${docId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'arraybuffer',
    });

    return response.data;
  } catch (error: any) {
    console.error('Failed to download DigiLocker document:', error.response?.data || error.message);
    throw new Error('Failed to download document from DigiLocker');
  }
}

/**
 * Map DigiLocker document type to PRISM document type
 */
export function mapDigiLockerDocType(docType: string): string {
  const lower = docType.toLowerCase();
  
  if (lower.includes('aadhaar') || lower.includes('aadhar')) return 'identity';
  if (lower.includes('pan')) return 'identity';
  if (lower.includes('passport')) return 'identity';
  if (lower.includes('driving') || lower.includes('license') || lower.includes('dl')) return 'identity';
  if (lower.includes('gstin')) return 'financial';
  if (lower.includes('esi')) return 'financial';
  if (lower.includes('pf')) return 'financial';
  if (lower.includes('nps')) return 'financial';
  if (lower.includes('insurance')) return 'financial';
  if (lower.includes('affidavit')) return 'legal';
  if (lower.includes('electricity') || lower.includes('water') || lower.includes('gas') || lower.includes('bill')) return 'address';
  
  return 'other';
}
