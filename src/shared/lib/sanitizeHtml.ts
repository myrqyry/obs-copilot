import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  try {
    // DOMPurify.sanitize may return TrustedHTML in some DOM typings; coerce to string
    const sanitized = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['on*', 'xmlns', 'xlink:href'],
      ALLOW_DATA_ATTR: false,
    } as any);
    return (sanitized as unknown as string) || '';
  } catch (e) {
    const tmp = document.createElement('div');
    tmp.textContent = html;
    return tmp.innerHTML;
  }
}

export function sanitizeSvg(svg: string): string {
  if (!svg) return '';
  try {
    const sanitized = DOMPurify.sanitize(svg, {
      SAFE_FOR_SVG: true,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['on*', 'xmlns', 'xlink:href'],
    } as any);
    return (sanitized as unknown as string) || '';
  } catch (e) {
    const tmp = document.createElement('div');
    tmp.textContent = svg;
    return tmp.innerHTML;
  }
}
