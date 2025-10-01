// Polyfills loaded before application code.
// Ensures Node globals expected by some libraries are available in the browser.
import { Buffer } from 'buffer';

if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

// You can extend this file with additional polyfills (process, global, etc.) as needed.
