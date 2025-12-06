// WCAG contrast helpers used by previews and tests
export function hexToRgb(hex: string) {
  if (!hex) return { r: 255, g: 255, b: 255 };
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const srgb = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hex1: string, hex2: string) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function mixTowards(hex: string, targetHex: string, fraction: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(targetHex);
  const r = Math.round(a.r + (b.r - a.r) * fraction);
  const g = Math.round(a.g + (b.g - a.g) * fraction);
  const bl = Math.round(a.b + (b.b - a.b) * fraction);
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function getWcagTextColor(bgHex: string, threshold = 4.5) {
  if (!bgHex) return '#000000';
  const black = '#000000';
  const white = '#ffffff';
  const ratioBlack = contrastRatio(bgHex, black);
  const ratioWhite = contrastRatio(bgHex, white);
  if (ratioBlack >= threshold && ratioBlack >= ratioWhite) return black;
  if (ratioWhite >= threshold && ratioWhite >= ratioBlack) return white;

  const betterIsWhite = ratioWhite > ratioBlack;
  const target = betterIsWhite ? white : black;
  for (let i = 1; i <= 8; i++) {
    const fraction = i * 0.08;
    const candidate = mixTowards(target === white ? bgHex : bgHex, target, fraction);
    const r = contrastRatio(bgHex, candidate);
    if (r >= threshold) return candidate;
  }
  return ratioWhite > ratioBlack ? white : black;
}
