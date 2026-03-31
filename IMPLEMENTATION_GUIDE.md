# PRISM System Upgrade - Implementation Guide

## 📍 Changed Files Summary

### Backend Changes

#### 1. `api-gateway/src/routes/documents.ts` - Enhanced with OCR & DigiLocker
**Added Functions:**
- `simulateOCRExtraction(docType, docName)` - Mock AI extraction based on document type
- `generateMockAadhaar()`, `generateMockPAN()`, `generateMockDL()` - Mock document generators
- `POST /api/documents/:id/extract` - Extract fields from uploaded document
- `POST /api/documents/:id/extract/confirm` - Save extracted fields to user profile
- `POST /api/documents/import-digilocker` - Import mock Aadhaar, PAN, DL

**Key Logic:**
```typescript
// Extract endpoint returns structured data with 87% confidence
{
  success: true,
  data: {
    fullName: "Rajesh Kumar",
    dateOfBirth: "1995-03-15",
    email: "rajesh.kumar@email.com",
    phone: "+91-98765-XXXXX",
    address: "123 Tech Park, Bangalore",
    // ... other fields based on docType
  },
  confidence: 0.87
}

// confirm endpoint merges into user profile
```

---

#### 2. `api-gateway/src/routes/assistant.ts` - Smart Rule-Based Suggestions
**Core Algorithm:**
```
Rule Engine with 8 Smart Rules:
1. No identity docs → "Complete Your Identity" (HIGH)
2. Employed + no financial → "Prepare Financial" (HIGH)
3. Age 25+ + no medical → "Add Medical Info" (MEDIUM)
4. 2+ docs + no DigiLocker → "Link DigiLocker" (MEDIUM)
5. Verified docs + no consents → "Grant Consents" (MEDIUM)
6. No Aadhaar + no crisis → "Enable Emergency" (LOW)
7. Trust < 50 + 3+ docs → "Boost Trust Score" (LOW)
8. Employed + age 22+ + no edu → "Verify Education" (LOW)
```

**New Endpoint:**
- `GET /api/assistant/suggestions` - FastReturns array of suggestions with priority
- Enhanced `POST /api/assistant/predict-stage` - Life stage + recommended bundle

---

#### 3. `api-gateway/src/routes/crisis.ts` - Emergency Profile
**New Endpoint:**
```typescript
GET /api/crisis/profile - Returns emergency medical profile
{
  name, age, phone, bloodGroup, allergies, medicalConditions,
  emergencyContact, medicalDocuments, lastUpdated
}
```

Enhanced existing endpoints to include more data.

---

### Frontend Changes

#### 1. `src/api/documents.ts` - New API Methods
```typescript
extractDocument(id: string)             // Parse document
confirmExtraction(id, data)             // Save to profile
importFromDigiLocker()                  // Mock import
```

#### 2. `src/api/assistant.ts` - NEW FILE
```typescript
getSuggestions()           // Get smart suggestions array
predictLifeStage()         // Predict user's life stage
```

#### 3. `src/api/crisis.ts` - NEW FILE
```typescript
getCrisisProfile()         // Get emergency info
activateCrisisMode()       // Generate 24h token
deactivateCrisisMode(token)// Revoke token
```

---

#### 4. `src/pages/DocumentsPage.tsx` - Enhanced with Extract & DigiLocker
**New Features:**
- Extract button (⚡ Zap icon) on each document row
- Extract modal shows extracted fields (editable)
- "Save to Profile" button merges data to user profile
- DigiLocker import button (top-right, blue/primary color)

**Code Changes:**
```typescript
// Extract handler
const handleExtract = async (docId: string, docName: string) => {
  const result = await extractDocument(docId);
  setExtractedModal({ docId, docName, data: result.data });
}

// Confirm handler
const handleConfirmExtraction = async () => {
  await confirmExtraction(extractedModal.docId, extractedModal.data);
  // Updates user identity + activity log
}

// DigiLocker handler
const handleImportDigiLocker = async () => {
  const result = await importFromDigiLocker();
  // Imports 3 mock documents, sets digilockerLinked = true
}
```

---

#### 5. `src/pages/CrisisPage.tsx` - NEW FILE (Complete Emergency UI)
Features:
- Emergency contact card (name, relation, phone)
- Medical profile (blood group prominent, age, allergies)
- Medical documents list
- Identifiers (ABHA ID, Aadhaar hash)
- Crisis token generator panel (activate/deactivate)
- Time remaining countdown

**Design:** Red-themed emergency styling with Tailwind

---

#### 6. `src/components/SuggestionBanner.tsx` - Redesigned
**Before:** Generic suggestion banner
**After:** Priority-based coloring
- RED for HIGH priority
- AMBER for MEDIUM priority
- BLUE for LOW priority

**Code:**
```typescript
const suggestions = await getSuggestions(); // New endpoint
const topSuggestion = suggestions.find(s => s.priority === 'high');
// Display with priority-specific styling
```

---

#### 7. `src/components/Sidebar.tsx` - Added Emergency Link
**Change:** Added AlertTriangle icon and /crisis route to navigation

```typescript
const navItems = [
  // ... existing items
  { icon: AlertTriangle, label: 'Emergency', path: '/crisis' }
  // Between autofill-test and settings
]
```

---

#### 8. `src/App.tsx` - Added Crisis Route
```typescript
import { CrisisPage } from './pages/CrisisPage';

<Routes>
  // ... existing routes
  <Route path="/crisis" element={<CrisisPage />} />
</Routes>
```

---

## 🎯 Data Flow Diagrams

### Document Extraction Flow
```
User Uploads File
    ↓
Auto-detect type (identity/financial/etc)
    ↓
Store in database
    ↓
User clicks ⚡ Extract
    ↓
simulateOCRExtraction() runs regex patterns
    ↓
Returns fields + confidence score in modal
    ↓
User reviews & edits fields
    ↓
Clicks "Save to Profile"
    ↓
Fields merge into user.profile
    ↓
Activity logged + WebSocket broadcast
```

### Smart Suggestions Flow
```
Dashboard loads
    ↓
GET /api/assistant/suggestions
    ↓
Rule engine analyzes:
  - User age
  - Document types
  - Verified status
  - DigiLocker link
  - Consent status
    ↓
Returns 0-8 suggestions with priority
    ↓
SuggestionBanner displays top (priority-based)
    ↓
Color-coded: RED (high) / AMBER (med) / BLUE (low)
```

### Emergency Access Flow
```
User visits /crisis
    ↓
CrisisPage fetches profile + blood group
    ↓
Shows emergency contact + medical info
    ↓
User clicks "Activate"
    ↓
24-hour crisis token generated
    ↓
Token displayed (copyable)
    ↓
Can share with emergency responders
    ↓
Token expires after 24h or can revoke manually
```

---

## 🧪 Testing Checklist

- [ ] Upload a document (any type)
- [ ] Click ⚡ Extract button
- [ ] Review extracted fields in modal
- [ ] Edit one field to test
- [ ] Click "Save to Profile"
- [ ] Check Identity page - data should be updated
- [ ] Go to AutofillTestPage - fields should be populated
- [ ] Click DigiLocker button - 3 documents should import
- [ ] Check Dashboard - suggestions should show
- [ ] Go to Emergency page (/crisis)
- [ ] Check blood group displays
- [ ] Click "Activate Emergency Access"
- [ ] Copy token
- [ ] Verify countdown shows 24h
- [ ] Click "Deactivate"
- [ ] Verify token removed

---

## 🔧 Environment & Dependencies

**No new packages needed!** Everything uses existing deps:
- express (backend routing)
- prisma (database)
- react/typescript (frontend)
- tailwind (styling)
- lucide-react (icons)

---

## 📊 Endpoint Reference

### New Backend Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | /api/documents/:id/extract | ✅ | `{ data, confidence }` |
| POST | /api/documents/:id/extract/confirm | ✅ | `{ fieldsUpdated, user }` |
| POST | /api/documents/import-digilocker | ✅ | `{ data: Document[] }` |
| GET | /api/assistant/suggestions | ✅ | `{ data: Suggestion[] }` |
| POST | /api/assistant/predict-stage | ✅ | `{ stage, title, icon }` |
| GET | /api/crisis/profile | ✅ | `{ name, bloodGroup, ... }` |

---

## 🎨 UI Component Locations

| Component | Path | Purpose |
|-----------|------|---------|
| DocumentsPage (Enhanced) | src/pages/DocumentsPage.tsx | Extract & DigiLocker UI |
| CrisisPage (NEW) | src/pages/CrisisPage.tsx | Emergency info display |
| SuggestionBanner (Updated) | src/components/SuggestionBanner.tsx | Smart suggestions |
| Sidebar (Updated) | src/components/Sidebar.tsx | Emergency nav link |

---

## 🚀 Deployment Checklist

- [ ] Backend routes added and tested
- [ ] Frontend components created
- [ ] API clients updated
- [ ] Routes registered in App.tsx
- [ ] Sidebar navigation updated
- [ ] Database schema supports new fields (already does)
- [ ] All imports correct
- [ ] No console errors
- [ ] Responsive design tested on mobile
- [ ] Demo flow works end-to-end

---

## ⚠️ Notes

1. **Mock Data:** All generated document data is simulated (names, numbers, etc.)
2. **Security:** Crisis tokens are 24-hour expiry, not production-grade
3. **Suggestions:** Rule engine is deterministic based on profile data
4. **Trust Score:** Currently mock, update with real scoring logic
5. **Database:** No migrations needed (schema already supports all fields)

---

## 📞 Support

All code is self-documenting with inline comments. Key functions:
- `simulateOCRExtraction()` - Doc parsing logic
- `generateSuggestions()` - Rule engine
- `handleExtract()` - UI extraction flow
- `handleActivateCrisis()` / `handleDeactivateCrisis()` - Token management

