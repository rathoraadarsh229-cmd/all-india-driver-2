import React from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { UserAuthType } from '../types';

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
 * - Email / Gmail users: GREEN badge (🟢 Email verified)
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
  if (type === 'phone' || type === 'truecaller') {
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

  // Email / Gmail Verified users -> Green badge
  return (
    <span
      className={`inline-flex items-center gap-1 font-black rounded-md border bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs select-none ${
        size === 'xs' 
          ? 'text-[8.5px] px-1.5 py-0.5' 
          : size === 'sm' 
          ? 'text-[9.5px] px-2 py-0.5' 
          : 'text-xs px-2.5 py-1'
      } ${className}`}
      title="Email verified खाता"
    >
      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 stroke-[2.5]" />
      <span className="tracking-wide uppercase font-sans font-black">
        {label || 'Email verified'}
      </span>
    </span>
  );
};
