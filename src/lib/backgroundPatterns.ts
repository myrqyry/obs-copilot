import type { ChatPattern } from '@/types/chatBackground';

export type PatternName = 'wavy' | 'rhombus' | 'zigzag' | 'circles' | 'lines' | 'triangle' | 'boxes' | 'polka' | 'diagonal' | 'isometric';

export const generatePatternCSS = (pattern: ChatPattern): string => {
  const { name, backColor, frontColor, opacity, spacing } = pattern;
  const back = `${backColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  const front = `${frontColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  const size = spacing;

  switch (name) {
    case 'wavy':
      return `repeating-linear-gradient(
        0deg,
        ${back},
        ${back} 50%,
        ${front} 50%,
        ${front}
      ), 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 50%,
        rgba(255,255,255,0.03) 50%,
        rgba(255,255,255,0.03)
      )`;
    case 'rhombus':
      return `repeating-conic-gradient(
        from 0deg,
        ${back} 0deg 90deg,
        ${front} 90deg 180deg,
        ${back} 180deg 270deg,
        ${front} 270deg 360deg
      )`;
    case 'zigzag':
      return `repeating-linear-gradient(
        45deg,
        ${back},
        ${back} ${size},
        ${front} ${size} ${parseInt(size) * 2}px
      )`;
    case 'circles':
      return `radial-gradient(circle at 25% 25%, ${front} 2px, ${back} 2px),
      radial-gradient(circle at 75% 75%, ${front} 2px, ${back} 2px)`;
    case 'lines':
      return `repeating-linear-gradient(
        to right,
        ${back},
        ${back} 1px,
        transparent 1px,
        transparent ${size}
      )`;
    case 'triangle':
      return `repeating-linear-gradient(
        0deg,
        ${back},
        ${back} 50%,
        transparent 50%,
        transparent 100%
      ),
      repeating-linear-gradient(
        60deg,
        transparent,
        transparent 50%,
        ${front} 50%,
        ${front} 100%
      )`;
    case 'boxes':
      return `repeating-linear-gradient(
        0deg,
        ${back},
        ${back} ${size},
        transparent ${size} ${parseInt(size) * 2}
      ),
      repeating-linear-gradient(
        90deg,
        ${back},
        ${back} ${size},
        transparent ${size} ${parseInt(size) * 2}
      )`;
    case 'polka':
      return `radial-gradient(circle at 20% 20%, ${front} 2px, transparent 2px),
      radial-gradient(circle at 80% 80%, ${front} 1px, transparent 1px) ${back}`;
    case 'diagonal':
      return `repeating-linear-gradient(
        45deg,
        ${back},
        ${back} ${size},
        transparent ${size} ${parseInt(size) * 2}
      )`;
    case 'isometric':
      return `repeating-conic-gradient(
        from 30deg,
        ${back} 0deg 60deg,
        ${front} 60deg 120deg,
        ${back} 120deg 180deg
      )`;
    default:
      return '';
  }
};