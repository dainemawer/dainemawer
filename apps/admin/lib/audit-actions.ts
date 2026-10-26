// Shared by the schema and the Settings page, so not server-only.

export const AUDIT_LABEL = {
  "sign-in": "Signed in",
  "sign-in-blocked": "Email sign-in refused",
  "sessions-revoked": "Signed out other sessions",
  "passkey-added": "Passkey added",
  "passkey-removed": "Passkey removed",
  "document-sent": "Document sent",
  "settings-saved": "Business settings changed",
  "expense-rule-saved": "Expense rule saved",
  "expense-rule-deleted": "Expense rule deleted",
  "expense-account-changed": "Expense account changed",
  "cron-failed": "Scheduled job failed",
} as const;

export type AuditAction = keyof typeof AUDIT_LABEL;
