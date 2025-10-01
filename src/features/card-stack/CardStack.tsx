import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CardStackProps {
  items: Array<{ id: string; title: string; description: string; image: string }>;
}

export const CardStack = ({ items }: CardStackProps) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    cardRefs.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, delay: index * 0.1, duration: 0.3 }
        );
      }
    });
  }, [items]);

  return (
    <div className="relative">
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => (cardRefs.current[index] = el)}
          className="absolute inset-0 bg-white rounded-lg shadow-lg"
        >
          <div className="p-4">
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};