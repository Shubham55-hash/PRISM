/*
  Warnings:

  - You are about to drop the column `digilocker_access_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digilocker_refresh_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digilocker_state` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digilocker_state_expires_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digilocker_token_expires_at` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
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
INSERT INTO "new_User" ("aadhaar_hash", "abha_id", "address_line", "biometric_status", "city", "created_at", "date_of_birth", "digilocker_linked", "display_name", "email", "full_name", "id", "password_hash", "pending_requests", "phone", "prism_id", "profile_photo_url", "security_tier", "state", "trust_score", "updated_at") SELECT "aadhaar_hash", "abha_id", "address_line", "biometric_status", "city", "created_at", "date_of_birth", "digilocker_linked", "display_name", "email", "full_name", "id", "password_hash", "pending_requests", "phone", "prism_id", "profile_photo_url", "security_tier", "state", "trust_score", "updated_at" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_prism_id_key" ON "User"("prism_id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
