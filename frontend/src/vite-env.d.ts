// src/vite-env.d.ts

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_PINECONE_API_KEY: string;
  readonly VITE_PINECONE_ENVIRONMENT: string;
  readonly VITE_PINECONE_INDEX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface Window {
  google: any;
}