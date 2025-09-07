import { GoogleGenAI, Type } from '@google/genai';
import { OverlayConfig, OverlayCustomization, GeneratedCode } from '@/types/overlay';
import { overlayTemplates } from '@/config/overlayTemplates';

const ai = new GoogleGenAI({}); // Assumes GEMINI_API_KEY environment variable is set

// Define the response schema for structured output
const overlaySchema = {
  type: Type.OBJECT,
  properties: {
    templateName: {
      type: Type.STRING,
      description: 'The name of the selected overlay template'
    },
    customizations: {
      type: Type.OBJECT,
      description: 'Customization options for the overlay',
      properties: {
        fontSize: {
          type: Type.STRING,
          description: 'Font size for the overlay text'
        },
        colors: {
          type: Type.OBJECT,
          description: 'Color scheme for the overlay',
          properties: {
            primary: { type: Type.STRING, description: 'Primary color' },
            secondary: { type: Type.STRING, description: 'Secondary color' },
            background: { type: Type.STRING, description: 'Background color' }
          }
        },
        position: {
          type: Type.OBJECT,
          description: 'Position of the overlay',
          properties: {
            x: { type: Type.NUMBER, description: 'X position' },
            y: { type: Type.NUMBER, description: 'Y position' }
          }
        },
        animation: {
          type: Type.STRING,
          description: 'Animation style for the overlay'
        },
        other: {
          type: Type.OBJECT,
          description: 'Other customizations',
          additionalProperties: true
        }
      }
    },
    generatedCode: {
      type: Type.OBJECT,
      description: 'Generated code for the customized overlay',
      properties: {
        html: {
          type: Type.STRING,
          description: 'HTML code for the overlay'
        },
        css: {
          type: Type.STRING,
          description: 'CSS styles for the overlay'
        },
        js: {
          type: Type.STRING,
          description: 'JavaScript functionality for the overlay'
        }
      }
    }
  },
  required: ['templateName', 'customizations', 'generatedCode'],
  propertyOrdering: ['templateName', 'customizations', 'generatedCode']
};

export async function generateOverlay(
  templateName: string,
  userDescription: string
): Promise<OverlayConfig> {
  // Find the selected template
  const template = overlayTemplates.find(t => t.templateName === templateName);
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  // Construct the prompt including template details and user requirements
  const prompt = `
    Using the following overlay template as a base, generate a customized streaming overlay based on the user's description.

    Template Name: ${templateName}
    Base Customizations: ${JSON.stringify(template.customizations)}
    Base HTML: ${template.generatedCode.html}
    Base CSS: ${template.generatedCode.css}
    Base JS: ${template.generatedCode.js}

    User Description: ${userDescription}

    Please generate a customized overlay that:
    1. Maintains the core functionality of the original template
    2. Applies appropriate customizations based on the user description
    3. Updates the HTML, CSS, and JavaScript accordingly
    4. Preserves placeholders for dynamic data (like {username}, {message}, etc.)
    5. Ensures the overlay is suitable for streaming use

    Return the complete customized overlay configuration.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: overlaySchema
      }
    });

    if (!response.text) {
      throw new Error('No response text received from Gemini');
    }

    // Parse the JSON response
    const overlayConfig: OverlayConfig = JSON.parse(response.text.trim());
    
    // Validate the response structure
    if (!overlayConfig.templateName || !overlayConfig.generatedCode) {
      throw new Error('Invalid response structure from Gemini');
    }

    return overlayConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate overlay: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating overlay');
  }
}

export async function saveOverlay(
  overlayConfig: OverlayConfig,
  overlayName: string
): Promise<string> {
  try {
    // Create the overlays directory if it doesn't exist (browser filesystem API)
    if (!window.FileSystemManager) {
      throw new Error('File system access not available in this environment');
    }

    const directoryHandle = await window.FileSystemManager.getDirectoryHandle(
      'public/overlays',
      { create: true }
    );

    // Create individual files for HTML, CSS, and JS
    const htmlFileHandle = await directoryHandle.getFileHandle(
      `${overlayName}.html`,
      { create: true }
    );
    const cssFileHandle = await directoryHandle.getFileHandle(
      `${overlayName}.css`,
      { create: true }
    );
    const jsFileHandle = await directoryHandle.getFileHandle(
      `${overlayName}.js`,
      { create: true }
    );

    // Write the content
    const htmlWritable = await htmlFileHandle.createWritable();
    await htmlWritable.write(overlayConfig.generatedCode.html);
    await htmlWritable.close();

    const cssWritable = await cssFileHandle.createWritable();
    await cssWritable.write(overlayConfig.generatedCode.css);
    await cssWritable.close();

    const jsWritable = await jsFileHandle.createWritable();
    await jsWritable.write(overlayConfig.generatedCode.js);
    await jsWritable.close();

    // Also create a config file
    const configFileHandle = await directoryHandle.getFileHandle(
      `${overlayName}-config.json`,
      { create: true }
    );
    const configWritable = await configFileHandle.createWritable();
    await configWritable.write(JSON.stringify(overlayConfig, null, 2));
    await configWritable.close();

    console.log(`Overlay "${overlayName}" saved successfully to public/overlays/`);
    return `public/overlays/${overlayName}`;
  } catch (error) {
    console.error('Failed to save overlay:', error);
    throw new Error(`Failed to save overlay: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export a function to get all available templates
export function getAvailableTemplates(): OverlayConfig[] {
  return [...overlayTemplates];
}

// Utility function to validate overlay config
export function validateOverlayConfig(config: OverlayConfig): boolean {
  return (
    typeof config.templateName === 'string' &&
    typeof config.customizations === 'object' &&
    typeof config.generatedCode === 'object' &&
    typeof config.generatedCode.html === 'string' &&
    typeof config.generatedCode.css === 'string' &&
    typeof config.generatedCode.js === 'string'
  );
}