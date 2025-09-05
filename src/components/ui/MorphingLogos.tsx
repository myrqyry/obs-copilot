import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { safeGsapTo, safeGsapSet } from '@/lib/utils';

const paths = {
    gemini: "M22.0728 0H25.925L26.0394 1.88084C26.3598 7.10156 28.5784 12.0249 32.2773 15.7235C35.9762 19.422 40.9 21.6404 46.1212 21.9608L48 22.0752V25.9248L46.1212 26.0392C40.9 26.3596 35.9762 28.578 32.2773 32.2765C28.5784 35.9751 26.3598 40.8984 26.0394 46.1192L25.925 48H22.075L21.9606 46.1192C21.6402 40.8984 19.4216 35.9751 15.7227 32.2765C12.0238 28.578 7.10001 26.3596 1.87882 26.0392L0 25.927V22.0752L1.87882 21.9608C7.10001 21.6404 12.0238 19.422 15.7227 15.7235C19.4216 12.0249 21.6402 7.10156 21.9606 1.88084L22.0728 0Z M24 10.4711C21.4154 16.5647 16.564 21.4156 10.4699 24C16.564 26.5844 21.4154 31.4353 24 37.5289C26.5846 31.4353 31.436 26.5844 37.5301 24C31.436 21.4156 26.5846 16.5647 24 10.4711Z",
    obs: "M48 24C48 37.2545 37.2545 48 24 48C10.7455 48 0 37.2545 0 24C0 10.7455 10.7455 0 24 0C37.2545 0 48 10.7455 48 24ZM40.4095 33.4385C41.3037 31.8735 41.641 30.0516 41.3661 28.2702C41.0912 26.4888 40.2204 24.8532 38.896 23.6306C37.5716 22.408 35.8717 21.6705 34.0741 21.5387C32.2764 21.4068 30.4872 21.8884 28.9985 22.9047C28.1274 23.5023 27.3839 24.2673 26.8113 25.155C26.2387 26.0428 25.8484 27.0356 25.6632 28.0756C25.478 29.1157 25.5016 30.1822 25.7326 31.213C25.9636 32.2439 26.3974 33.2184 27.0087 34.08C27.1539 34.2606 27.2331 34.4854 27.2331 34.7171C27.2331 34.9488 27.1539 35.1736 27.0087 35.3542C26.1537 36.3757 25.1374 37.2505 24 37.944C21.4148 39.4304 18.3674 39.897 15.4559 39.2524C12.5443 38.6078 9.97873 36.8984 8.26255 34.4596C9.31337 35.8135 10.7726 36.7926 12.4238 37.2517C14.075 37.7108 15.8302 37.6254 17.429 37.0082C19.0279 36.391 20.3852 35.2748 21.2996 33.8254C22.214 32.3759 22.6369 30.6702 22.5055 28.9615C22.4259 27.9083 22.1376 26.8814 21.6574 25.9407C21.1772 24.9999 20.5147 24.1641 19.7084 23.4819C18.9021 22.7997 17.9682 22.2846 16.9609 21.9668C15.9537 21.649 14.8933 21.5347 13.8415 21.6305C13.6155 21.6663 13.3841 21.6219 13.1873 21.5052C12.9905 21.3885 12.8407 21.2067 12.7636 20.9913C12.295 19.7219 12.0528 18.3801 12.048 17.0269C12.042 13.9938 13.1889 11.0717 15.2566 8.85257C17.3242 6.6334 20.158 5.28302 23.184 5.07491C22.0255 5.19053 20.9063 5.55864 19.9053 6.15334C18.9044 6.74804 18.0459 7.55488 17.3903 8.51708C16.7348 9.47928 16.298 10.5735 16.1109 11.7226C15.9237 12.8718 15.9906 14.048 16.307 15.1685C16.6233 16.289 17.1814 17.3266 17.9419 18.2082C18.7024 19.0898 19.6469 19.794 20.7089 20.2713C21.7709 20.7486 22.9245 20.9873 24.0887 20.9707C25.2529 20.9541 26.3993 20.6826 27.4473 20.1753C29.1248 19.3837 30.4659 18.0209 31.2305 16.3309C31.32 16.1215 31.476 15.9475 31.6745 15.8359C31.8729 15.7243 32.1026 15.6812 32.328 15.7135C33.6084 15.9726 34.8344 16.4509 35.952 17.1273C37.3157 17.9056 38.5128 18.9449 39.4749 20.1858C40.4369 21.4268 41.1451 22.845 41.559 24.3597C41.973 25.8744 42.0845 27.4557 41.8872 29.0135C41.69 30.5712 41.1878 32.0749 40.4095 33.4385Z",
};

interface MorphingLogosProps {
    accentColor: string;
    secondaryAccentColor: string;
}

const MorphingLogos: React.FC<MorphingLogosProps> = ({ accentColor, secondaryAccentColor }) => {
    const morphingPathRef = useRef<SVGPathElement>(null);
    const stop1Ref = useRef<SVGStopElement>(null);
    const stop2Ref = useRef<SVGStopElement>(null);
    const colorAnimationRef = useRef<gsap.core.Tween | null>(null);

    useLayoutEffect(() => {
        const morphingPath = morphingPathRef.current;
        if (!morphingPath) return;

        // Set initial path
        safeGsapSet(morphingPath, { attr: { d: paths.gemini } });

        // This will now work correctly!
        safeGsapTo(morphingPath, {
            duration: 2.8,
            ease: "power2.inOut",
            morphSVG: {
                shape: paths.obs,
                origin: "24 24"
            },
            repeat: -1,
            repeatDelay: 1.2,
            yoyo: true
        });

        // Continuous slow rotation for polish
        safeGsapTo(morphingPath, {
            duration: 12,
            ease: "none",
            rotation: 360,
            repeat: -1,
            transformOrigin: "24 24"
        });
    }, []);

    useEffect(() => {
        const stop1 = stop1Ref.current;
        const stop2 = stop2Ref.current;
        if (!stop1 || !stop2) return;

        if (colorAnimationRef.current) {
            colorAnimationRef.current.kill();
            colorAnimationRef.current = null;
        }

        // Initialize stop colors
        safeGsapSet(stop1, { attr: { 'stop-color': accentColor } });
        safeGsapSet(stop2, { attr: { 'stop-color': secondaryAccentColor } });

        // Animate gradient stop colors
        colorAnimationRef.current = safeGsapTo([stop1, stop2], {
            duration: 6,
            ease: "power2.inOut",
            attr: {
                'stop-color': (i) => i === 0 ? secondaryAccentColor : accentColor
            },
            repeat: -1,
            repeatDelay: 0,
            yoyo: true
        });

        return () => {
            if (colorAnimationRef.current) {
                colorAnimationRef.current.kill();
                colorAnimationRef.current = null;
            }
        };
    }, [accentColor, secondaryAccentColor]);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width={48}
            height={48}
        >
            <defs>
                <radialGradient id="logo-gradient" cx="50%" cy="50%" r="75%">
                    <stop ref={stop1Ref} offset="0%" stopColor={accentColor} />
                    <stop ref={stop2Ref} offset="100%" stopColor={secondaryAccentColor} />
                </radialGradient>
            </defs>
            <path
                ref={morphingPathRef}
                fill="url(#logo-gradient)"
                d={paths.gemini}
                fillRule="evenodd"
            />
        </svg>
    );
};

export default MorphingLogos;

