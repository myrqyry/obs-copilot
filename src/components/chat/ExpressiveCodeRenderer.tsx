import React, { useMemo } from 'react';
import { ExpressiveCode } from 'expressive-code';
import { ShikiPlugin } from '@expressive-code/plugin-shiki';

interface ExpressiveCodeRendererProps {
  code: string;
  lang: string;
}

export const ExpressiveCodeRenderer: React.FC<ExpressiveCodeRendererProps> = ({ code, lang }) => {
  const expressiveCode = useMemo(() => {
    return new ExpressiveCode({
      plugins: [new ShikiPlugin()],
    });
  }, []);

  const { html } = useMemo(() => {
    return expressiveCode.render({
      code,
      language: lang,
    });
  }, [expressiveCode, code, lang]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
