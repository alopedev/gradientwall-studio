/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEMONSQUEEZY_STORE?: string;
  readonly VITE_NEWSLETTER_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
