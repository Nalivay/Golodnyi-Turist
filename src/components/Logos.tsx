import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Logo_Golodnyy_Turist.png (Restaurant Golodnyy Turist Badge)
 */
export const LogoGolodnyyTurist: React.FC<LogoProps> = ({ className = "w-52 h-52", size }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/Logo_Golodnyy_Turist.png"
        alt="Ресторан «Голодный Турист»"
        className="max-w-full max-h-full w-auto h-auto object-contain filter drop-shadow-md rounded-2xl"
        loading="eager"
      />
    </div>
  );
};

export const LogoArmMinsk = LogoGolodnyyTurist;
export const LogoApmMinsk = LogoGolodnyyTurist;
export const LogoArmenia = LogoGolodnyyTurist;
export const LogoMinsk = LogoGolodnyyTurist;

/**
 * Universal Restaurant Banner / Logo Renderer for White-Label support.
 */
export const UniversalRestaurantLogo: React.FC<{
  restaurantId?: string;
  className?: string;
  logoType?: string;
  customLogoUrl?: string;
  name?: string;
  indicator?: string;
  themeColor?: string;
}> = ({
  className = "w-full max-w-[260px]",
}) => {
  return <LogoGolodnyyTurist className={className} />;
};

/**
 * Universal App Logo for Splash & Login screens
 */
export const UniversalAppLogo: React.FC<{
  className?: string;
  size?: number | string;
  logoType?: string;
  customUrl?: string;
}> = ({
  className = "w-64 h-64",
  size,
}) => {
  return <LogoGolodnyyTurist className={className} size={size} />;
};
