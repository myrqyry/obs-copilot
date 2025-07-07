import React, { useState } from 'react';
import { HtmlTemplateService } from '../services/htmlTemplateService';
const TemplateWizard = () => {
    const [step, setStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customConfig, setCustomConfig] = useState({});
    const templates = HtmlTemplateService.getPresetTemplates();
    const handleNext = () => {
        if (step < 2)
            setStep(step + 1);
    };
    const handleBack = () => {
        if (step > 0)
            setStep(step - 1);
    };
    const handleFinish = () => {
        if (selectedTemplate) {
            const finalConfig = { ...templates[selectedTemplate], ...customConfig };
            const templateUrl = HtmlTemplateService.generateTemplateUrl(finalConfig);
            console.log('Generated Template URL:', templateUrl);
            alert(`Template URL: ${templateUrl}`);
        }
    };
    return (<div className="template-wizard">
            {step === 0 && (<div>
                    <h2>Select a Template</h2>
                    <ul>
                        {Object.keys(templates).map((key) => (<li key={key}>
                                <button onClick={() => setSelectedTemplate(key)}>
                                    {templates[key].content?.title || key}
                                </button>
                            </li>))}
                    </ul>
                </div>)}
            {step === 1 && selectedTemplate && (<div>
                    <h2>Customize Template</h2>
                    <label>
                        Title:
                        <input type="text" value={customConfig.content?.title || ''} onChange={(e) => setCustomConfig({
                ...customConfig,
                content: { ...customConfig.content, title: e.target.value },
            })}/>
                    </label>
                    <label>
                        Background Color:
                        <input type="color" value={customConfig.colors?.background || '#000000'} onChange={(e) => setCustomConfig({
                ...customConfig,
                colors: { ...customConfig.colors, background: e.target.value },
            })}/>
                    </label>
                </div>)}
            {step === 2 && selectedTemplate && (<div>
                    <h2>Preview Template</h2>
                    <p>Title: {customConfig.content?.title || templates[selectedTemplate].content?.title}</p>
                    <p>Background Color: {customConfig.colors?.background || templates[selectedTemplate].colors?.background}</p>
                </div>)}
            <div className="wizard-navigation">
                {step > 0 && <button onClick={handleBack}>Back</button>}
                {step < 2 && <button onClick={handleNext}>Next</button>}
                {step === 2 && <button onClick={handleFinish}>Finish</button>}
            </div>
        </div>);
};
export default TemplateWizard;
