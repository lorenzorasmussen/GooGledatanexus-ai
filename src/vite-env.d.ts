// src/vite-env.d.ts

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Add other environment variables here as needed, e.g.:
  // readonly VITE_SOME_OTHER_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}