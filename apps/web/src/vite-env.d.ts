/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_DOMAINS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
