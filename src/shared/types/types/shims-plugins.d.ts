// Temporary shims to unblock incremental type-checking
// TODO: replace with proper types or update tsconfig moduleResolution

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

declare module 'vitest' {
  export const vi: any;
  export function describe(...args: any[]): any;
  export function it(...args: any[]): any;
  export function test(...args: any[]): any;
  export function expect(...args: any[]): any;
  export function beforeEach(...args: any[]): any;
  export function afterEach(...args: any[]): any;
  export type SpyInstance = any;
}
