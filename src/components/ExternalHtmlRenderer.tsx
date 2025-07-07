import React from 'react';
import DOMPurify from 'dompurify';

interface ExternalHtmlRendererProps {
    htmlContent: string;
    customCss: string;
}

const ExternalHtmlRenderer: React.FC<ExternalHtmlRendererProps> = ({ htmlContent, customCss }) => {
    return (
        <div>
            <style>{customCss}</style>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
        </div>
    );
};

export default ExternalHtmlRenderer;
