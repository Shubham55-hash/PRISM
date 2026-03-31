-- AddColumn digilocker_access_token to User
ALTER TABLE "User" ADD COLUMN "digilocker_access_token" TEXT;

-- AddColumn digilocker_refresh_token to User
ALTER TABLE "User" ADD COLUMN "digilocker_refresh_token" TEXT;

-- AddColumn digilocker_token_expires_at to User
ALTER TABLE "User" ADD COLUMN "digilocker_token_expires_at" DATETIME;

-- AddColumn digilocker_state to User
ALTER TABLE "User" ADD COLUMN "digilocker_state" TEXT;

-- AddColumn digilocker_state_expires_at to User
ALTER TABLE "User" ADD COLUMN "digilocker_state_expires_at" DATETIME;
