import Matter from 'matter-js';
import { PhysicsConfig } from '../presets/StylePresets';

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private emotebodies: Map<string, Matter.Body> = new Map();
  private elementMap: Map<string, HTMLElement> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.gravity.y = 0.5; // A bit of gravity

    this.setupBoundaries(container);
    this.startPhysics();
  }

  public updateWorldProperties(config: PhysicsConfig) {
    this.engine.gravity.y = config.gravity;
  }

  private setupBoundaries(container: HTMLElement) {
    const { width, height } = container.getBoundingClientRect();
    const wallOptions = { isStatic: true };

    Matter.World.add(this.world, [
      // Floor
      Matter.Bodies.rectangle(width / 2, height, width, 50, wallOptions),
      // Ceiling
      Matter.Bodies.rectangle(width / 2, 0, width, 50, wallOptions),
      // Left wall
      Matter.Bodies.rectangle(0, height / 2, 50, height, wallOptions),
      // Right wall
      Matter.Bodies.rectangle(width, height / 2, 50, height, wallOptions),
    ]);
  }

  private startPhysics() {
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, this.engine);

    const update = () => {
      this.emotebodies.forEach((body, id) => {
        const element = this.elementMap.get(id);
        if (element) {
          this.syncElementWithBody(element, body);
        }
      });
      requestAnimationFrame(update);
    };

    update();
  }

  public addEmotePhysics(emoteElement: HTMLElement, options = {}) {
    const id = emoteElement.id;
    const body = Matter.Bodies.rectangle(
      emoteElement.offsetLeft,
      emoteElement.offsetTop,
      emoteElement.offsetWidth,
      emoteElement.offsetHeight,
      {
        restitution: 0.6,
        friction: 0.1,
        frictionAir: 0.02,
        ...options,
      }
    );

    Matter.World.add(this.world, body);
    this.emotebodies.set(id, body);
    this.elementMap.set(id, emoteElement);

    return body;
  }

  public removeEmote(emoteId: string) {
      const body = this.emotebodies.get(emoteId);
      if (body) {
          Matter.World.remove(this.world, body);
          this.emotebodies.delete(emoteId);
          this.elementMap.delete(emoteId);
      }
  }

  private syncElementWithBody(element: HTMLElement, body: Matter.Body) {
    // We set the element's position absolutely and then use transform for rotation.
    // This avoids compounding transforms and issues with offsetLeft/Top.
    element.style.left = `${body.position.x - element.offsetWidth / 2}px`;
    element.style.top = `${body.position.y - element.offsetHeight / 2}px`;
    element.style.transform = `rotate(${body.angle}rad)`;
  }
}