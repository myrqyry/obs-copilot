import { geminiService } from '@/services/geminiService';

class GenerativeAlertService {
  constructor() {
    // In a real application, we would listen to events from a service like Streamer.bot or Twitch's API
    // For example:
    // streamerbot.on('Twitch.Follow', (data) => {
    //   this.handleNewFollower(data.user.displayName);
    // });
  }

  public async handleNewFollower(username: string) {
    try {
      // Generate a personalized message
      const messageResponse = await geminiService.generateText({
        prompt: `Write a short, exciting thank you message for a new follower named ${username}.`,
      });
      const message = messageResponse.text;

      // Generate an image
      const imageResponse = await geminiService.generateImage({
        prompt: `A vibrant, abstract image representing a new follower named ${username}.`,
      });
      const imageUrl = imageResponse.url;

      // In a real application, we would send this data to the alert overlay
      console.log('Generated Alert:', { username, message, imageUrl });

      // Post a message to the window to be picked up by the overlay
      window.postMessage({
          type: 'newFollower',
          username,
          message,
          imageUrl
      }, '*');

    } catch (error) {
      console.error('Error generating alert:', error);
    }
  }
}

export const generativeAlertService = new GenerativeAlertService();
