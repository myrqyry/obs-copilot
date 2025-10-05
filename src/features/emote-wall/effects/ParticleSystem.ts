interface Vector2 {
  x: number;
  y: number;
}

abstract class Particle {
  protected position: Vector2;
  protected velocity: Vector2;
  protected lifespan: number;
  protected initialLifespan: number;

  constructor(position: Vector2, velocity: Vector2, lifespan: number) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.lifespan = lifespan;
    this.initialLifespan = lifespan;
  }

  // Returns true if the particle should be removed
  abstract update(deltaTime: number): boolean;
  abstract render(ctx: CanvasRenderingContext2D): void;

  isDead(): boolean {
    return this.lifespan <= 0;
  }
}

class EmoteParticle extends Particle {
  private image: HTMLImageElement;
  private size: number;
  private rotation: number;
  private rotationSpeed: number;
  private opacity: number;

  constructor(position: Vector2, image: HTMLImageElement, options: any = {}) {
    const velocity = options.velocity || {
      x: (Math.random() - 0.5) * (options.power || 200),
      y: (Math.random() - 0.5) * (options.power || 200) - 100, // Bias upwards
    };
    const lifespan = options.lifespan || 2; // in seconds
    super(position, velocity, lifespan);

    this.image = image;
    this.size = options.size || Math.random() * 15 + 10; // 10px to 25px
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 5;
    this.opacity = 1;
  }

  update(deltaTime: number): boolean {
    // Apply gravity
    this.velocity.y += 98 * deltaTime; // Simplified gravity

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;

    // Update lifespan and opacity
    this.lifespan -= deltaTime;
    this.opacity = Math.max(0, this.lifespan / this.initialLifespan);

    return this.isDead();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(
      this.image,
      -this.size / 2,
      -this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }
}

class TrailParticle extends Particle {
  private size: number;
  private color: string;
  private opacity: number;

  constructor(position: Vector2, options: any = {}) {
    const velocity = options.velocity || { x: 0, y: 0 };
    const lifespan = options.lifespan || 0.5;
    super(position, velocity, lifespan);

    this.size = options.size || Math.random() * 5 + 2; // 2px to 7px
    this.color = options.color || '#ffffff';
    this.opacity = 1;
  }

  update(deltaTime: number): boolean {
    this.lifespan -= deltaTime;
    this.opacity = Math.max(0, this.lifespan / this.initialLifespan);
    return this.isDead();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


export class ParticleSystem {
  private particles: Particle[] = [];
  private activeTrails: Map<string, any> = new Map();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // Clicks go through the canvas
    this.canvas.style.zIndex = '0'; // Behind emotes
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;

    this.resizeCanvas(container);
    // Listen for container resize
    const resizeObserver = new ResizeObserver(() => this.resizeCanvas(container));
    resizeObserver.observe(container);
  }

  private resizeCanvas(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.update.bind(this));
  }

  public stop() {
    this.isRunning = false;
  }

  public addParticle(particle: Particle) {
    this.particles.push(particle);
  }

  public createEmoteExplosion(position: Vector2, emoteImage: HTMLImageElement, options: any = {}) {
    const count = options.count || 50;
    for (let i = 0; i < count; i++) {
      this.addParticle(new EmoteParticle(position, emoteImage, options));
    }
  }

  public createTrailEffect(emoteElement: HTMLElement, options: any = {}) {
    if (!emoteElement.id) {
      console.error("Element must have an ID to create a trail effect.", emoteElement);
      return;
    }
    this.activeTrails.set(emoteElement.id, {
      element: emoteElement,
      options: {
        color: options.color || '#FFFFFF',
        size: options.size || 4,
        lifespan: options.lifespan || 0.4,
      },
      lastPosition: { x: emoteElement.offsetLeft, y: emoteElement.offsetTop }
    });
  }

  public removeTrailEffect(elementId: string) {
    this.activeTrails.delete(elementId);
  }

  private update(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Delta time in seconds
    this.lastFrameTime = currentTime;

    // Clear canvas for the new frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Generate trail particles
    this.activeTrails.forEach(trail => {
      const newPos = { x: trail.element.offsetLeft + trail.element.offsetWidth / 2, y: trail.element.offsetTop + trail.element.offsetHeight / 2 };
      const oldPos = trail.lastPosition;

      const distance = Math.hypot(newPos.x - oldPos.x, newPos.y - oldPos.y);

      // Only create a new particle if it has moved a certain distance
      if (distance > 5) {
          this.addParticle(new TrailParticle(newPos, trail.options));
          trail.lastPosition = newPos;
      }
    });

    // Update and render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const isDead = particle.update(deltaTime);

      if (isDead || particle.isDead()) {
        this.particles.splice(i, 1);
      } else {
        particle.render(this.ctx);
      }
    }

    requestAnimationFrame(this.update.bind(this));
  }
}