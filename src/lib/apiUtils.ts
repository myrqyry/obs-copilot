import { logger } from '../utils/logger';
import { AxiosResponse } from 'axios';



export async function handleServiceCall<T>(
  call: () => Promise<AxiosResponse<T>>,
  serviceName: string,
  errorMessagePrefix: string,
  dataKey?: keyof T // Optional key to check for data presence, e.g., 'audio'
): Promise<T> {
  try {
    const response = await call();
    const responseData = response.data;

    if (dataKey && (!responseData || !(responseData as any)[dataKey])) {
      logger.error(`No ${String(dataKey)} content returned from ${serviceName} API`);
      throw new Error(`No ${String(dataKey)} content returned from ${serviceName} API`);
    }

    return responseData;
  } catch (error) {
    logger.error(`${errorMessagePrefix} via ${serviceName}:`, error);
    throw new Error(
      `${errorMessagePrefix}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
