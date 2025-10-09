class WebSocketPool {
  private pools: Map<string, WebSocket[]> = new Map();
  private readonly maxPoolSize = 3;

  getConnection(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const pool = this.pools.get(url) || [];
      const availableSocket = pool.find(ws => ws.readyState === WebSocket.OPEN);

      if (availableSocket) {
        resolve(availableSocket);
        return;
      }

      // Create new connection if pool is empty or connections are unavailable
      const ws = new WebSocket(url);
      ws.onopen = () => resolve(ws);
      ws.onerror = (error) => reject(error);
      ws.onclose = () => this.removeFromPool(url, ws);
    });
  }

  private removeFromPool(url: string, ws: WebSocket) {
    const pool = this.pools.get(url) || [];
    const index = pool.indexOf(ws);
    if (index > -1) {
      pool.splice(index, 1);
    }
  }
}