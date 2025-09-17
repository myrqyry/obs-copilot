export type ChatBackgroundType = 'image' | 'css';

export type PatternName = 'wavy' | 'rhombus' | 'zigzag' | 'circles' | 'lines' | 'triangle' | 'boxes' | 'polka' | 'diagonal' | 'isometric';

export interface ChatPattern {
  name: PatternName;
  backColor: string; // hex, e.g., '#667eea'
  frontColor: string; // hex, e.g., '#764ba2'
  opacity: number; // 0 to 1
  spacing: string; // e.g., '100px'
}