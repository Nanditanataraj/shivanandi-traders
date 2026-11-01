import React from 'react';
import { useApp } from '../context/AppContext.tsx';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  logoUrl?: string;
  isDark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
  logoUrl,
  isDark = false
}) => {
  let contextLogoUrl: string | undefined;
  try {
    const app = useApp();
    contextLogoUrl = app.warehouse?.logoUrl;
  } catch {
    // If used outside AppContext
  }

  const effectiveLogoUrl =
    logoUrl ||
    contextLogoUrl ||
    '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-sm font-black tracking-tight',
    md: 'text-base sm:text-lg font-black tracking-tight',
    lg: 'text-xl sm:text-2xl font-black tracking-tight',
    xl: 'text-2xl sm:text-3xl font-black tracking-tight'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Shiva Nandi Traders circular emblem */}
      <div className={`relative rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm bg-black shrink-0 ${iconSizes[size]}`}>
        <img
          src={effectiveLogoUrl}
          alt="Shiva Nandi Traders Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="flex flex-col">
        <span className={`leading-none ${isDark ? 'text-white' : 'text-[#111827]'} ${textSizes[size]}`}>
          SHIVANANDI <span className="text-[#C59B27]">TRADERS</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold text-[#9A7B1C] tracking-[0.18em] mt-0.5">
            Mysuru · Fast Delivery
          </span>
        )}
      </div>
    </div>
  );
};
