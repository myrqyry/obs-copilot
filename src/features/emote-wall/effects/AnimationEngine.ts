import { gsap } from 'gsap';
import { AnimationStyle } from '../core/types';

export class AnimationEngine {
  public createEmoteEntrance(emoteElement: HTMLElement, style: AnimationStyle) {
    const animations = {
      bounce: () => this.bounceIn(emoteElement),
      slide: () => this.slideIn(emoteElement),
      epic: () => this.epicEntrance(emoteElement),
      physics: () => this.physicsDropIn(emoteElement),
    };

    return animations[style]?.() || animations.bounce();
  }

  private bounceIn(element: HTMLElement) {
    const tl = gsap.timeline();
    tl.from(element, { scale: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    return tl;
  }

  private slideIn(element: HTMLElement) {
    const tl = gsap.timeline();
    tl.from(element, { x: -100, opacity: 0, duration: 0.5, ease: 'power2.out' });
    return tl;
  }

  private epicEntrance(element: HTMLElement) {
    const tl = gsap.timeline();

    tl.set(element, { scale: 0, rotation: -360, opacity: 0 })
      .to(element, {
        duration: 0.8,
        scale: 1.2,
        rotation: 0,
        opacity: 1,
        ease: 'back.out(2.5)',
      })
      .to(element, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out',
      });

    return tl;
  }

  private physicsDropIn(element: HTMLElement) {
    // This will be more tightly integrated with the PhysicsEngine in Phase 3
    const tl = gsap.timeline();
    tl.from(element, { y: -200, opacity: 0, duration: 1, ease: 'bounce.out' });
    return tl;
  }
}