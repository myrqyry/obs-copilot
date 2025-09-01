'use client';

import { CustomButton as Button } from '@/components/ui/CustomButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatStatus } from 'ai';
import { Loader2Icon, SendIcon, SquareIcon, XIcon, ImageUpIcon, ClipboardPasteIcon } from 'lucide-react';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { Children, useState, useCallback, forwardRef } from 'react';
import { ImageUpload } from '@/components/common/ImageUpload';

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm',
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  label?: string; // Add label prop
  onImageSelect?: (file: File, base64: string) => void;
  onClearImage?: () => void;
};

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, PromptInputTextareaProps & {
  onImageSelect?: (file: File, base64: string) => void;
  onClearImage?: () => void;
}>(({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  label = 'Type your message...', // Default label for the prompt input
  id = 'prompt-input-textarea', // Default ID for accessibility
  onImageSelect,
  onClearImage,
  ...props
}, ref) => {
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isImagePasted, setIsImagePasted] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return;
      }

      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = (e.target?.result as string).split(',')[1];
              onImageSelect?.(blob, base64);
              setIsImagePasted(true);
            };
            reader.readAsDataURL(blob);
            event.preventDefault();
            return;
          }
        }
      }
    }
  }, [onImageSelect]);

  const handleImageUploadSelect = (file: File, base64: string) => {
    onImageSelect?.(file, base64);
    setIsImageUploadOpen(false);
  };

  const handleImageClear = () => {
    onClearImage?.();
    setIsImagePasted(false);
  };

  return (
    <>
      <Textarea
        className={cn(
          'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
          'field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent',
          'focus-visible:ring-0',
          className
        )}
        name="message"
        onChange={(e) => {
          onChange?.(e);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={label ? '' : placeholder} // Conditionally set placeholder
        label={label} // Pass label to Textarea
        id={id} // Pass id to Textarea
        ref={ref}
        {...props}
      />
      <div className="flex items-center gap-2 p-2">
        <PromptInputButton
          onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
          variant="ghost"
          size="icon"
          title="Upload Image"
        >
          <ImageUpIcon className="size-4" />
        </PromptInputButton>
        <PromptInputButton
          onClick={() => {
            // Trigger paste functionality
            navigator.clipboard.read().then(async (clipboardItems) => {
              for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                  if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    // Create a File object from the Blob
                    const file = new File([blob], 'pasted_image.png', { type: blob.type });
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const base64 = (e.target?.result as string).split(',')[1];
                      onImageSelect?.(file, base64);
                      setIsImagePasted(true);
                    };
                    reader.readAsDataURL(file);
                    return;
                  }
                }
              }
            });
          }}
          variant="ghost"
          size="icon"
          title="Paste Image"
          disabled={isImagePasted}
        >
          <ClipboardPasteIcon className="size-4" />
        </PromptInputButton>
        {(isImageUploadOpen || isImagePasted) && (
          <PromptInputButton
            onClick={handleImageClear}
            variant="ghost"
            size="icon"
            title="Clear Image"
          >
            <XIcon className="size-4" />
          </PromptInputButton>
        )}
      </div>
      {isImageUploadOpen && (
        <div className="p-2">
          <ImageUpload onImageSelect={handleImageUploadSelect} onClear={handleImageClear} />
        </div>
      )}
    </>
  );
});

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn('flex items-center justify-between p-1', className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-1',
      '[&_button:first-child]:rounded-bl-xl',
      className
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';

  return (
    <Button
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === 'submitted') {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === 'error') {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn('gap-1.5 rounded-lg', className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);
