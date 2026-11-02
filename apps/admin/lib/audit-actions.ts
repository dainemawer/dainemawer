// Shared by the schema and the Settings page, so not server-only.

export const AUDIT_LABEL = {
  "sign-in": "Signed in",
  "sign-in-blocked": "Email sign-in refused",
  "sessions-revoked": "Signed out other sessions",
  "passkey-added": "Passkey added",
  "passkey-removed": "Passkey removed",
  "document-sent": "Document sent",
  "payment-recorded": "Payment recorded",
  "payment-removed": "Payment removed",
  "settings-saved": "Business settings changed",
  "expense-rule-saved": "Expense rule saved",
  "expense-rule-deleted": "Expense rule deleted",
  "expense-account-changed": "Expense account changed",
  "cron-failed": "Scheduled job failed",
  "post-merged": "Blog post approved and merged",
  "til-drafted": "TIL drafted from Telegram",
} as const;

export type AuditAction = keyof typeof AUDIT_LABEL;

/**
 * Which audit events also go to Telegram (lib/audit.ts): "alert" buzzes
 * your phone, "quiet" arrives silently, null stays in the log only.
 */
export const AUDIT_TELEGRAM: Record<AuditAction, "alert" | "quiet" | null> = {
  // Passkey sign-ins from a familiar device and city arrive quietly
  // instead: lib/sign-in-alert.ts.
  "sign-in": "alert",
  "sign-in-blocked": "alert",
  "sessions-revoked": "alert",
  "passkey-added": "alert",
  "passkey-removed": "alert",
  "settings-saved": "quiet",
  "cron-failed": "alert",
  "document-sent": "quiet",
  "payment-recorded": "quiet",
  "payment-removed": "quiet",
  "post-merged": "quiet",
  // The bot's own reply says so already.
  "til-drafted": null,
  "expense-rule-saved": null,
  "expense-rule-deleted": null,
  "expense-account-changed": null,
};
