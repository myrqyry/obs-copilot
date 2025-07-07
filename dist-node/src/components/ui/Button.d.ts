import React from 'react';
import { HTMLMotionProps } from 'framer-motion';
interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
    children: React.ReactNode;
}
declare const Button: React.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { Button };
