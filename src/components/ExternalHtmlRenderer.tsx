import React from 'react';

interface ExternalHtmlRendererProps {
    htmlContent: string;
    customCss: string;
}

const ExternalHtmlRenderer: React.FC<ExternalHtmlRendererProps> = ({ htmlContent, customCss }) => {
    return (
        <div>
            <style>{customCss}</style>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
    );
};

export default ExternalHtmlRenderer;
