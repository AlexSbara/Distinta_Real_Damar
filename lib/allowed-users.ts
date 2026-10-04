export const allowedEmails = new Set(['alex.sbaragli@gmail.com','matteo.fantinati2004@gmail.com']);
export function isAllowedEmail(email: unknown): email is string { return typeof email === 'string' && allowedEmails.has(email.toLowerCase()); }
export function canSignInWithGoogle(provider: unknown, profile: {email?:unknown;email_verified?:unknown}|undefined) { return provider === 'google' && profile?.email_verified === true && isAllowedEmail(profile.email); }
