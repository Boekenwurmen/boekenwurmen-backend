-- Add reset fields to Client for password reset flow
ALTER TABLE Client ADD COLUMN resetToken TEXT;
ALTER TABLE Client ADD COLUMN resetTokenExpires DATETIME;