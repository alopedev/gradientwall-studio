/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEMONSQUEEZY_STORE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
