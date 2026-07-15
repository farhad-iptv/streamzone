import { ApiResponse, SportsEvent } from './types';

const API_URL = 'https://api.footmad-ivan-flux.shop/ivan-flux';

export async function fetchEvents(): Promise<SportsEvent[]> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      return data.events || [];
    } catch (error) {
      attempt++;
      console.error(`Failed to fetch events (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  return [];
}
