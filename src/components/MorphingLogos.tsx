import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// Normalized paths with consistent center points and bounding boxes
const paths = {
    obs: "M24,4C12.971,4,4,12.971,4,24s8.971,20,20,20s20-8.971,20-20S35.029,4,24,4z M40.317,32.15 c1.102-3.234-0.114-6.983-3.102-8.896c-3.499-2.24-8.151-1.218-10.391,2.281l0,0c-1.612,2.518-1.527,5.63-0.053,8.013 c-0.877,1.353-2.06,2.537-3.539,3.418c-4.696,2.8-10.744,1.697-14.109-2.417c-0.162-0.228-0.319-0.458-0.47-0.693 c2.278,2.846,6.438,3.663,9.71,1.817c3.618-2.042,4.897-6.63,2.855-10.249l0,0c-1.407-2.493-4.023-3.875-6.698-3.825 c-0.864-1.558-1.359-3.35-1.359-5.258c0-4.767,3.076-8.799,7.346-10.261c0.313-0.061,0.633-0.101,0.951-0.146 c-2.888,1.05-4.955,3.812-4.955,7.063c0,4.155,3.368,7.523,7.523,7.523c2.764,0,5.173-1.495,6.481-3.717 c1.91,0.013,3.841,0.517,5.589,1.587c4.397,2.69,6.237,8.082,4.687,12.794C40.641,31.516,40.477,31.832,40.317,32.15z",
    gemini: "M46.117,23.081l-0.995-0.04H45.12C34.243,22.613,25.387,13.757,24.959,2.88l-0.04-0.996C24.9,1.39,24.494,1,24,1s-0.9,0.39-0.919,0.883l-0.04,0.996c-0.429,10.877-9.285,19.733-20.163,20.162l-0.995,0.04C1.39,23.1,1,23.506,1,24s0.39,0.9,0.884,0.919l0.995,0.039c10.877,0.43,19.733,9.286,20.162,20.163l0.04,0.996C23.1,46.61,23.506,47,24,47s0.9-0.39,0.919-0.883l0.04-0.996c0.429-10.877,9.285-19.733,20.162-20.163l0.995-0.039C46.61,24.9,47,24.494,47,24S46.61,23.1,46.117,23.081z"
};

function MorphingLogos() {
    const svgRef = useRef<SVGSVGElement>(null);
    const morphingPathRef = useRef<SVGPathElement>(null);
    const stop1Ref = useRef<SVGStopElement>(null);
    const stop2Ref = useRef<SVGStopElement>(null);

    // Set initial path directly for visibility
    React.useEffect(() => {
        const morphingPath = morphingPathRef.current;
        if (morphingPath) {
            morphingPath.setAttribute('d', paths.obs);
        }
    }, []);

    // Animation effect (only runs if MorphSVGPlugin is loaded and GSAP is available)
    useLayoutEffect(() => {
        const svg = svgRef.current;
        const morphingPath = morphingPathRef.current;
        const stop1 = stop1Ref.current;
        const stop2 = stop2Ref.current;
        if (!svg || !morphingPath || !stop1 || !stop2) return;

        // Defensive: ensure MorphSVGPlugin is registered
        if (!gsap.utils || !gsap.to || !gsap.timeline || !gsap.set || !gsap.plugins || !MorphSVGPlugin) {
            return;
        }
        gsap.registerPlugin(MorphSVGPlugin);

        // Initial colors
        const getAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--dynamic-accent').trim() || "#cba6f7";
        const getAccent2 = () => getComputedStyle(document.documentElement).getPropertyValue('--dynamic-secondary-accent').trim() || "#f2cdcd";

        gsap.set(svg, {
            transformOrigin: "center center"
        });
        gsap.set(morphingPath, {
            attr: { d: paths.obs },
            transformOrigin: "24px 24px"
        });
        gsap.set(stop1, { stopColor: getAccent() });
        gsap.set(stop2, { stopColor: getAccent2() });

        const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
        // Phase 1: Morph to Gemini
        masterTl.to(morphingPath, {
            morphSVG: {
                shape: paths.gemini,
                origin: "50% 50%",
                shapeIndex: "auto",
                map: "complexity"
            },
            duration: 3,
            ease: "back.inOut(1.2)",
            transformOrigin: "24px 24px"
        }, 0);
        masterTl.to(morphingPath, {
            rotation: 5,
            duration: 1.5,
            ease: "power2.out",
            transformOrigin: "24px 24px"
        }, 0);
        masterTl.to(morphingPath, {
            rotation: 0,
            duration: 1.5,
            ease: "power2.in",
            transformOrigin: "24px 24px"
        }, 1.5);
        masterTl.to(stop1, {
            stopColor: getAccent2(),
            duration: 3,
            ease: "power1.inOut"
        }, 0);
        masterTl.to(stop2, {
            stopColor: getAccent(),
            duration: 3,
            ease: "power1.inOut"
        }, 0);
        // Phase 2: Morph back to OBS
        masterTl.to(morphingPath, {
            morphSVG: {
                shape: paths.obs,
                origin: "50% 50%",
                shapeIndex: "auto",
                map: "complexity"
            },
            duration: 3,
            ease: "back.inOut(1.2)",
            transformOrigin: "24px 24px"
        }, 6);
        masterTl.to(morphingPath, {
            rotation: -5,
            duration: 1.5,
            ease: "power2.out",
            transformOrigin: "24px 24px"
        }, 6);
        masterTl.to(morphingPath, {
            rotation: 0,
            duration: 1.5,
            ease: "power2.in",
            transformOrigin: "24px 24px"
        }, 7.5);
        masterTl.to(stop1, {
            stopColor: getAccent(),
            duration: 3,
            ease: "power1.inOut"
        }, 6);
        masterTl.to(stop2, {
            stopColor: getAccent2(),
            duration: 3,
            ease: "power1.inOut"
        }, 6);
        return () => {
            masterTl.kill();
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width={48}
            height={48}
            style={{ display: 'block' }}
        >
            <defs>
                <radialGradient id="logo-gradient" cx="50%" cy="50%" r="80%">
                    <stop ref={stop1Ref} offset="0%" stopColor="#cba6f7" />
                    <stop ref={stop2Ref} offset="100%" stopColor="#f2cdcd" />
                </radialGradient>
            </defs>
            <path
                ref={morphingPathRef}
                d={paths.obs}
                fill="url(#logo-gradient)"
            />
        </svg>
    );
}

export default MorphingLogos;
