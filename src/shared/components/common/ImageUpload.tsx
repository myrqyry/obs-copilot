import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui";
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File, base64: string) => void;
  onClear?: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onClear,
  accept = "image/*",
  maxSizeMB = 10,
  className = "",
  placeholder = "Click to upload image"
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setLoading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data URL prefix

        // Create preview
        setPreview(result);

        // Call callback
        onImageSelect(file, base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <Button
          onClick={handleClick}
          disabled={loading}
          variant="outline"
          className="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-6 h-6" />
            <span className="text-sm">{loading ? 'Processing...' : placeholder}</span>
            <span className="text-xs text-muted-foreground">Max {maxSizeMB}MB</span>
          </div>
        </Button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded border"
          />
          <Button
            onClick={handleClear}
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
