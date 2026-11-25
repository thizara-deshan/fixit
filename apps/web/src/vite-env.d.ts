/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_DOMAINS?: string;
  readonly VITE_CONTACT_EMAIL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
