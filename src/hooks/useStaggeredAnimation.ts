import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useStaggeredAnimation = (items: any[]) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && items.length > 0) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'power3.out',
                }
            );
        }
    }, [items]);

    return containerRef;
};
