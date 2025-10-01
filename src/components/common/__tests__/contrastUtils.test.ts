import { contrastRatio, getWcagTextColor } from '../../../utils/contrast';

describe('WCAG contrast helpers', () => {
  test('contrastRatio between black and white is ~21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeGreaterThan(20);
  });

  test('getWcagTextColor picks black for light bg', () => {
    const c = getWcagTextColor('#ffffff');
    expect(c).toBe('#000000');
  });

  test('getWcagTextColor picks white for dark bg', () => {
    const c = getWcagTextColor('#000000');
    expect(c).toBe('#ffffff');
  });
});
