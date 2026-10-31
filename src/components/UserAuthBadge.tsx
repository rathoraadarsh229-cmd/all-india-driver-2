import React from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { UserAuthType } from '../types';

// Crisp Official Google "G" Logo SVG Icon
export const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

interface UserAuthBadgeProps {
  type?: UserAuthType | 'phone' | 'email';
  isExample?: boolean;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Universal User Verification Badge (Only Phone verified or Email verified allowed):
 * - Phone users: GREEN badge (🟢 Phone verified)
 * - Email / Gmail users: GREEN badge with Google icon
 * - Guest users: ORANGE badge (🟠 Guest Account)
 */
export const UserAuthBadge: React.FC<UserAuthBadgeProps> = ({
  type = 'gmail',
  isExample = false,
  label,
  size = 'xs',
  className = ''
}) => {

  // Guest users -> Orange badge
  if (type === 'guest') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-black rounded-md border bg-orange-50 text-orange-850 border-orange-300 shadow-2xs select-none ${
          size === 'xs' 
            ? 'text-[8.5px] px-1.5 py-0.5' 
            : size === 'sm' 
            ? 'text-[9.5px] px-2 py-0.5' 
            : 'text-xs px-2.5 py-1'
        } ${className}`}
        title="गेस्ट लॉगिन"
      >
        <span className="h-2 w-2 rounded-full bg-brand-orange shrink-0 animate-pulse" />
        <span className="tracking-wide uppercase font-sans font-black">
          {label || 'Guest User'}
        </span>
      </span>
    );
  }

  // Phone Verified users -> Green badge
  if (type === 'phone') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-black rounded-md border bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs select-none ${
          size === 'xs' 
            ? 'text-[8.5px] px-1.5 py-0.5' 
            : size === 'sm' 
            ? 'text-[9.5px] px-2 py-0.5' 
            : 'text-xs px-2.5 py-1'
        } ${className}`}
        title="OTP / मोबाइल द्वारा Phone verified"
      >
        <Smartphone className="h-3 w-3 text-emerald-600 shrink-0 stroke-[2.5]" />
        <span className="tracking-wide uppercase font-sans font-black">
          {label || 'Phone verified'}
        </span>
      </span>
    );
  }

  // Email / Gmail Verified users -> Green badge with Google icon
  return (
    <span
      className={`inline-flex items-center gap-1 font-black rounded-md border bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-2xs select-none ${
        size === 'xs' 
          ? 'text-[8.5px] px-1.5 py-0.5' 
          : size === 'sm' 
          ? 'text-[9.5px] px-2 py-0.5' 
          : 'text-xs px-2.5 py-1'
      } ${className}`}
      title="Google / Email verified खाता"
    >
      <GoogleLogoSvg className="h-3 w-3 shrink-0" />
      <span className="tracking-wide uppercase font-sans font-black">
        {label || 'Google Verified'}
      </span>
      <span className="text-emerald-400 font-black">✓</span>
    </span>
  );
};
