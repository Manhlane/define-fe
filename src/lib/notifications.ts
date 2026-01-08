const NOTIFICATIONS_BASE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ?? 'http://localhost:3005/notifications';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function post(path: string, payload: unknown): Promise<void> {
  try {
    await fetch(`${NOTIFICATIONS_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Failed to send notification', error);
  }
}

export const NotificationsClient = {
  dashboardUrl: `${APP_BASE_URL}/dashboard`,
  buildVerifyUrl: (token: string) =>
    `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`,
  buildResetUrl: (token: string) =>
    `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`,
  sendWelcomeEmail: (payload: { email: string; name?: string; verificationUrl?: string | null }) =>
    post('/auth/welcome', {
      ...payload,
      dashboardUrl: `${APP_BASE_URL}/dashboard`,
    }),
  sendVerificationEmail: (payload: { email: string; name?: string; verificationUrl: string }) =>
    post('/auth/verify-email', payload),
  sendLoginFromNewDeviceEmail: (payload: {
    email: string;
    name?: string;
    location?: string;
    ipAddress?: string;
    device?: string;
    loginAt?: string;
  }) => post('/auth/login-alert', payload),
  sendPasswordResetEmail: (payload: {
    email: string;
    name?: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }) => post('/auth/password-reset', payload),
  sendPasswordChangedEmail: (payload: {
    email: string;
    name?: string;
    changedAt?: string;
    loginActivityUrl?: string;
    supportUrl?: string;
  }) => post('/auth/password-changed', payload),
};

export type NotificationsClientType = typeof NotificationsClient;
