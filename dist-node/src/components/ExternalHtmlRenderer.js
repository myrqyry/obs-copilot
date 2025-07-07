import React from 'react';
import DOMPurify from 'dompurify';
const ExternalHtmlRenderer = ({ htmlContent, customCss }) => {
    return (<div>
            <style>{customCss}</style>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}/>
        </div>);
};
export default ExternalHtmlRenderer;
