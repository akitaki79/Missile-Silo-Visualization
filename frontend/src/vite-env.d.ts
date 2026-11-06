/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL. Leave unset to load /data/bases at build time instead. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
