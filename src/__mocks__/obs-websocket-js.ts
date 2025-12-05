import { vi } from 'vitest';

export class OBSWebSocket {
  connect = vi.fn().mockResolvedValue(undefined);
  disconnect = vi.fn().mockResolvedValue(undefined);
  call = vi.fn().mockResolvedValue({});
  on = vi.fn();
  off = vi.fn();
}

export default OBSWebSocket;
