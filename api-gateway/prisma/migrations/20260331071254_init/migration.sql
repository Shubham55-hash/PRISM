-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prism_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date_of_birth" TEXT,
    "address_line" TEXT,
    "city" TEXT,
    "state" TEXT,
    "aadhaar_hash" TEXT,
    "abha_id" TEXT,
    "digilocker_linked" BOOLEAN NOT NULL DEFAULT false,
    "biometric_status" TEXT NOT NULL DEFAULT 'active',
    "security_tier" INTEGER NOT NULL DEFAULT 3,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "profile_photo_url" TEXT,
    "password_hash" TEXT NOT NULL,
    "pending_requests" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "original_filename" TEXT,
    "document_type" TEXT,
    "file_size_bytes" INTEGER,
    "mime_type" TEXT,
    "local_path" TEXT,
    "ocr_extracted_fields" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "vc_credential_id" TEXT,
    "vc_issued_at" DATETIME,
    "vc_expires_at" DATETIME,
    "vc_proof" TEXT,
    "upload_source" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "institution_id" TEXT,
    "purpose" TEXT NOT NULL,
    "access_tier" INTEGER NOT NULL DEFAULT 1,
    "allowed_fields" TEXT,
    "consent_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "granted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "last_accessed_at" DATETIME,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "institution_logo_url" TEXT,
    CONSTRAINT "Consent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entity_name" TEXT,
    "entity_type" TEXT,
    "document_id" TEXT,
    "consent_id" TEXT,
    "metadata" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "Consent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "score_breakdown" TEXT,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrustScoreHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "is_verified_partner" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LifeStagePrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "predicted_stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "suggested_bundle" TEXT,
    "is_actioned" BOOLEAN NOT NULL DEFAULT false,
    "predicted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LifeStagePrediction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_prism_id_key" ON "User"("prism_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_consent_token_key" ON "Consent"("consent_token");
