/** SPEC §10.2 #2: public contact email (placeholder until M22). */
export const CONTACT_EMAIL: string = import.meta.env.VITE_CONTACT_EMAIL ?? 'hello@fixit.test';

/** ARCH §10.3: show "Continue with Google" (S5, S6). */
export const GOOGLE_ENABLED: boolean = import.meta.env.VITE_GOOGLE_ENABLED === 'true';
