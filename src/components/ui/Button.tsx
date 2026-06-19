import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    
    const variants = {
      primary: 'bg-gradient-to-r from-[#1A73E8] to-[#1557B0] text-white hover:from-[#1557B0] hover:to-[#0D47A1] focus:ring-[#1A73E8]/50 shadow-lg shadow-[#1A73E8]/20',
      secondary: 'bg-gradient-to-r from-[#34A853] to-[#2E8B47] text-white hover:from-[#2E8B47] hover:to-[#276E3B] focus:ring-[#34A853]/50 shadow-lg shadow-[#34A853]/20',
      outline: 'border-2 border-[#1A73E8] text-[#1A73E8] hover:bg-[#1A73E8]/5 focus:ring-[#1A73E8]/30',
      ghost: 'text-[#1A73E8] hover:bg-[#1A73E8]/10 focus:ring-[#1A73E8]/20',
      danger: 'bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] text-white hover:from-[#EE5A5A] hover:to-[#D94949] focus:ring-[#FF6B6B]/50 shadow-lg shadow-[#FF6B6B]/20'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-8 py-3.5 text-lg gap-2.5'
    };
    
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
