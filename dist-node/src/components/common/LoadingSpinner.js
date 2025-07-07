import React from 'react';
import { cn } from '../../lib/utils';
export const LoadingSpinner = ({ size = 8, className, variant = 'default', color = 'primary', text, fullScreen = false, speed = 'normal', }) => {
    const getColorStyles = () => {
        switch (color) {
            case 'primary':
                return 'text-primary';
            case 'accent':
                return 'text-accent';
            case 'success':
                return 'text-green-500';
            case 'warning':
                return 'text-orange-500';
            case 'destructive':
                return 'text-destructive';
            case 'muted':
                return 'text-muted-foreground';
            case 'white':
                return 'text-white';
            default:
                return 'text-primary';
        }
    };
    const getSpeedStyles = () => {
        switch (speed) {
            case 'slow':
                return 'animate-spin-slow';
            case 'fast':
                return 'animate-spin-fast';
            default:
                return 'animate-spin';
        }
    };
    const getColorClass = () => {
        return getColorStyles();
    };
    const renderSpinner = () => {
        const sizeClass = `w-${size} h-${size}`;
        const colorClass = getColorClass();
        switch (variant) {
            case 'pulse':
                return (<div className={cn('animate-pulse', sizeClass, colorClass, className)}>
            <div className="w-full h-full bg-current rounded-full"/>
          </div>);
            case 'dots':
                return (<div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((i) => (<div key={i} className={cn('animate-bounce bg-current rounded-full', sizeClass, colorClass)} style={{ animationDelay: `${i * 0.1}s` }}/>))}
          </div>);
            case 'bars':
                return (<div className={cn('flex space-x-1', className)}>
            {[0, 1, 2, 3].map((i) => (<div key={i} className={cn('animate-pulse bg-current rounded', colorClass)} style={{
                            width: `${size * 0.25}rem`,
                            height: `${size}rem`,
                            animationDelay: `${i * 0.1}s`,
                        }}/>))}
          </div>);
            case 'ring':
                return (<div className={cn('relative', sizeClass, className)}>
            <div className={cn('absolute inset-0 border-2 border-current border-t-transparent rounded-full', getSpeedStyles(), colorClass)}/>
          </div>);
            case 'chase':
                return (<div className={cn('relative', sizeClass, className)}>
            {[0, 1, 2, 3, 4, 5].map((i) => (<div key={i} className={cn('absolute top-0 left-0 w-full h-full border-2 border-current border-t-transparent rounded-full', getSpeedStyles(), colorClass)} style={{
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1.2s',
                        }}/>))}
          </div>);
            case 'cube':
                return (<div className={cn('relative', sizeClass, className)}>
            <div className={cn('w-full h-full bg-current animate-pulse', colorClass)} style={{ transform: 'rotate(45deg)' }}/>
          </div>);
            case 'wave':
                return (<div className={cn('flex space-x-1', className)}>
            {[0, 1, 2, 3, 4].map((i) => (<div key={i} className={cn('animate-pulse bg-current rounded-full', colorClass)} style={{
                            width: `${size * 0.2}rem`,
                            height: `${size * 0.2}rem`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1s',
                        }}/>))}
          </div>);
            case 'ripple':
                return (<div className={cn('relative', sizeClass, className)}>
            <div className={cn('absolute inset-0 border-2 border-current rounded-full animate-ping', colorClass)}/>
            <div className={cn('absolute inset-2 border-2 border-current rounded-full animate-ping', colorClass)} style={{ animationDelay: '0.2s' }}/>
          </div>);
            case 'orbit':
                return (<div className={cn('relative', sizeClass, className)}>
            <div className={cn('absolute inset-0 border-2 border-current border-t-transparent rounded-full', getSpeedStyles(), colorClass)}/>
            <div className={cn('absolute inset-2 border-2 border-current border-b-transparent rounded-full', getSpeedStyles(), colorClass)} style={{ animationDirection: 'reverse' }}/>
          </div>);
            case 'heartbeat':
                return (<div className={cn('animate-pulse', sizeClass, colorClass, className)}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>);
            case 'bounce':
                return (<div className={cn('animate-bounce', sizeClass, colorClass, className)}>
            <div className="w-full h-full bg-current rounded-full"/>
          </div>);
            default:
                return (<svg className={cn(getSpeedStyles(), sizeClass, colorClass, className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>);
        }
    };
    if (fullScreen) {
        return (<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          {renderSpinner()}
          {text && (<p className="text-sm text-muted-foreground animate-pulse">{text}</p>)}
        </div>
      </div>);
    }
    return (<div className="flex flex-col items-center space-y-2">
      {renderSpinner()}
      {text && (<p className="text-xs text-muted-foreground">{text}</p>)}
    </div>);
};
