// This file will contain the logic for rendering emotes on the screen.
// It will be responsible for creating and managing the visual representation of emotes.

export class EmoteRenderer {
  constructor(private container: HTMLElement) {}

  public renderEmote(emoteUrl: string, emoteId: string): HTMLElement {
    const emoteElement = document.createElement('img');
    emoteElement.src = emoteUrl;
    emoteElement.id = emoteId;
    emoteElement.style.position = 'absolute';
    emoteElement.style.width = '64px'; // A default size, can be configured later
    emoteElement.style.height = '64px';
    emoteElement.style.objectFit = 'contain';
    this.container.appendChild(emoteElement);
    return emoteElement;
  }
}