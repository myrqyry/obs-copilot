// src/features/media/ImageEditorTemplates.tsx
import React from 'react';
import { Button } from "@/components/ui";
import { CardContent } from '@/components/ui/Card';
import { Sparkles, Users, Globe, BookOpen, Camera, Palette } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'character-consistency',
    title: 'Character Consistency',
    description: 'Create consistent characters across multiple images',
    icon: <Users className="w-5 h-5" />,
    prompt: 'Create a consistent character with the following traits: [describe character appearance, clothing, style]',
    category: 'Characters'
  },
  {
    id: 'multi-image-fusion',
    title: 'Multi-Image Fusion',
    description: 'Combine multiple concepts into one cohesive image',
    icon: <Camera className="w-5 h-5" />,
    prompt: 'Fuse these concepts together: [concept 1] + [concept 2] + [concept 3]',
    category: 'Fusion'
  },
  {
    id: 'world-knowledge',
    title: 'World Knowledge',
    description: 'Educational content with factual accuracy',
    icon: <Globe className="w-5 h-5" />,
    prompt: 'Create an educational illustration about [topic] with accurate historical/scientific details',
    category: 'Education'
  },
  {
    id: 'artistic-style',
    title: 'Artistic Style Transfer',
    description: 'Apply famous artistic styles to your images',
    icon: <Palette className="w-5 h-5" />,
    prompt: 'Transform this image into the style of [artist/art movement]',
    category: 'Art'
  },
  {
    id: 'educational-diagram',
    title: 'Educational Diagram',
    description: 'Create detailed educational diagrams and illustrations',
    icon: <BookOpen className="w-5 h-5" />,
    prompt: 'Create a detailed diagram explaining [concept] with labels and annotations',
    category: 'Education'
  }
];

interface ImageEditorTemplatesProps {
  onTemplateSelect: (template: Template) => void;
  className?: string;
}

export const ImageEditorTemplates: React.FC<ImageEditorTemplatesProps> = ({ 
  onTemplateSelect,
  className = ''
}) => {
  const categories = Array.from(new Set(TEMPLATES.map(t => t.category)));

  return (
    <div className={className}>
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {category} Templates
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.filter(t => t.category === category).map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  onClick={() => onTemplateSelect(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1 font-mono bg-muted/50 p-1 rounded mt-2">
                        {template.prompt}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageEditorTemplates;
