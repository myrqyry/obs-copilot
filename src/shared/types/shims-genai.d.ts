// Temporary permissive shims for @google/genai types to unblock incremental
// TypeScript fixes. Replace with real types from the package or handcrafted
// interfaces when possible.

declare module '@google/genai' {
  export const GoogleGenAI: any;
  export type GenerateContentResponse = any;
  export type GenerateImagesResponse = any;
  export type LiveServerMessage = any;
  export type LiveConnectParameters = any;
  export type GenerateImagesConfig = any;
  export type GenerateContentConfig = any;
  export type LiveMusicGenerationConfig = any;
  export type LiveMusicSession = any;
  export type LiveConnectParams = any;
  export const ai: any;
  export const types: any;
  export const models: any;
  export const caches: any;
  export default {} as any;
}
// Temporary shim for @google/genai used during local dev/type-check
// This file provides permissive `any`-typed named exports to avoid blocking
// the frontend type-check while we iteratively update exact types.

declare module '@google/genai' {
  // Common names used across the repo (add more as needed)
  export const GoogleGenAI: any;
  export const Type: any;
  export const LiveMusicGenerationConfig: any;
  export const LiveMusicSession: any;
  export const GenerateContentResponse: any;
  export const GenerateImagesResponse: any;
  export const LiveConnectParameters: any;
  export const GenerateImagesConfig: any;
  export const GenerateContentConfig: any;
  export const LiveServerMessage: any;
  export default {} as any;
}
