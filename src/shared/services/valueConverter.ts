import { logger } from '@/shared/utils/logger';

export class ValueConverter {
  static convertVolumeDb(value: number): number {
    // Clamp volume to OBS range (-60 to 0 dB)
    const clamped = Math.max(-60, Math.min(0, value));
    logger.info(`Converted volume to dB: ${clamped}`);
    return clamped;
  }

  static convertVolumeLinearToDb(linear: number): number {
    // Convert linear 0-1 to dB (-60 to 0)
    // dB = 20 * log10(linear)
    if (linear <= 0) return -60;
    if (linear >= 1) return 0;
    const db = 20 * Math.log10(linear);
    return Math.max(-60, Math.min(0, db));
  }

  static convertVolumeDbToLinear(db: number): number {
    // Convert dB to linear 0-1
    // linear = 10^(db/20)
    db = Math.max(-60, Math.min(0, db));
    const linear = Math.pow(10, db / 20);
    return Math.max(0, Math.min(1, linear));
  }

  static parseColor(hex: string): { r: number; g: number; b: number; a: number } {
    // Parse hex color like #RRGGBB or #RRGGBBAA to RGB(A)
    const hexRegex = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;
    if (!hexRegex.test(hex)) {
      throw new Error('Invalid hex color format. Use #RRGGBB or #RRGGBBAA');
    }
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    let a = 255;
    if (hex.length === 8) {
      a = (bigint >> 0) & 255;
    }
    return { r, g, b, a };
  }

  static formatColor(r: number, g: number, b: number, a: number = 255): string {
    // Format RGB(A) to hex #RRGGBBAA
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    a = Math.max(0, Math.min(255, Math.round(a)));
    const hex = ((r << 24) | (g << 16) | (b << 8) | a).toString(16).padStart(8, '0');
    return `#${hex}`;
  }

  static convertPercentageToDb(percentage: number): number {
    // Convert 0-100% to dB (-60 to 0)
    percentage = Math.max(0, Math.min(100, percentage));
    const linear = percentage / 100;
    return this.convertVolumeLinearToDb(linear);
  }

  static convertDbToPercentage(db: number): number {
    // Convert dB to 0-100%
    db = Math.max(-60, Math.min(0, db));
    const linear = this.convertVolumeDbToLinear(db);
    return Math.round(linear * 100);
  }

  // Add more converters as needed for other value types (e.g., time formats, etc.)
  static validateAndConvert(type: string, value: any): any {
    switch (type) {
      case 'volume_db':
        return this.convertVolumeDb(value);
      case 'volume_linear_to_db':
        return this.convertVolumeLinearToDb(value);
      case 'volume_db_to_linear':
        return this.convertVolumeDbToLinear(value);
      case 'color_hex_to_rgba':
        return this.parseColor(value);
      case 'rgba_to_hex':
        return this.formatColor(value.r, value.g, value.b, value.a);
      case 'percentage_to_db':
        return this.convertPercentageToDb(value);
      case 'db_to_percentage':
        return this.convertDbToPercentage(value);
      default:
        logger.warn(`Unknown conversion type: ${type}`);
        return value;
    }
  }
}