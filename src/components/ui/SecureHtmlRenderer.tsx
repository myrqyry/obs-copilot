import React from 'react';
import DOMPurify from 'dompurify';

interface SecureHtmlRendererProps {
  htmlContent: string;
  allowedTags?: string[];
  allowedAttrs?: Record<string, string[]>;
  className?: string;
}

export const SecureHtmlRenderer: React.FC<SecureHtmlRendererProps> = ({
  htmlContent,
  allowedTags = ['img', 'span'],
  allowedAttrs = {
    img: ['src', 'alt', 'title', 'class', 'style', 'loading'],
    span: ['class', 'style']
  },
  className = ''
}) => {
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['on*', 'xmlns', 'xlink:href']
  } as any);

  return (
    <div
      className={`message-text whitespace-pre-wrap break-words flex-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml.toString() }}
    />
  );
};
export default SecureHtmlRenderer;
