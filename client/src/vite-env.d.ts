/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_HERO_SLOT_ID?: string;
  readonly VITE_ADSENSE_SIDEBAR_SLOT_ID?: string;
  readonly VITE_ADSENSE_FOOTER_SLOT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  adsbygoogle?: Array<Record<string, unknown>>;
}

