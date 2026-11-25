/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_DOMAINS?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_GOOGLE_ENABLED?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
