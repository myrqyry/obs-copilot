type Action = () => Promise<any>;

class ActionQueueService {
  private static instance: ActionQueueService;
  private queue: Action[] = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): ActionQueueService {
    if (!ActionQueueService.instance) {
      ActionQueueService.instance = new ActionQueueService();
    }
    return ActionQueueService.instance;
  }

  public enqueue<T>(action: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await action();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error("Action failed in queue:", error);
          // The promise is already rejected in the `enqueue` method,
          // so we just log the error here.
        }
      }
    }

    this.isProcessing = false;
  }
}

export const actionQueueService = ActionQueueService.getInstance();