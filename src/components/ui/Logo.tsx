/**
 * InvestIQ Logo Component
 * Font: Switzer (Fontshare, self-hosted)
 *
 * Variants:
 * - wordmark: Typography only (InvestIQ)
 * - horizontal: Symbol + wordmark side by side
 * - stacked: Symbol + wordmark + tagline stacked
 * - symbol: Badge icon only (for favicon/app icon)
 *
 * Usage:
 * <Logo variant="wordmark" size="lg" />
 * <Logo variant="horizontal" />
 * <Logo variant="symbol" size={32} />
 */

import React from 'react';

type LogoVariant = 'wordmark' | 'horizontal' | 'stacked' | 'symbol';
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | number;

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

// Brand colors
const COLORS = {
  electricBlue: '#1A73E8',
  white: '#FFFFFF',
};

// Size mappings for wordmark
const FONT_SIZES: Record<string, number> = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 48,
};

// Symbol component (the aQ badge)
const Symbol: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="InvestIQ symbol"
  >
    <rect x="4" y="4" width="48" height="48" rx="12" fill={COLORS.electricBlue} />
    <text
      x="28"
      y="38"
      fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      fontWeight="700"
      fontSize="26"
      fill={COLORS.white}
      textAnchor="middle"
    >
      aQ
    </text>
  </svg>
);

// Wordmark component (typography only)
const Wordmark: React.FC<{ fontSize: number; className?: string }> = ({ fontSize, className }) => (
  <span
    className={className}
    style={{
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      fontWeight: 700,
      fontSize: `${fontSize}px`,
      letterSpacing: '-0.04em',
      display: 'inline-flex',
      alignItems: 'baseline',
    }}
  >
    <span style={{ color: COLORS.electricBlue }}>aQ</span>
    <span style={{ color: 'var(--logo-text-color, #0F2B46)' }}>-Invest</span>
  </span>
);

// Tagline component
const Tagline: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={className}
    style={{
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      fontSize: '13px',
      fontWeight: 400,
      letterSpacing: '0.02em',
      opacity: 0.6,
      color: 'var(--logo-text-color, #0F2B46)',
    }}
  >
    Inteligência que valoriza.
  </span>
);

export const Logo: React.FC<LogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  className = '',
}) => {
  // Calculate sizes
  const fontSize = typeof size === 'number' ? size : (FONT_SIZES[size] ?? FONT_SIZES['md'])!;
  const symbolSize = typeof size === 'number' ? size : Math.round(fontSize * 1.2);

  // Symbol only
  if (variant === 'symbol') {
    return (
      <div className={className}>
        <Symbol size={typeof size === 'number' ? size : symbolSize} />
      </div>
    );
  }

  // Wordmark only
  if (variant === 'wordmark') {
    return <Wordmark fontSize={fontSize} className={className} />;
  }

  // Horizontal: Symbol + Wordmark
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Symbol size={Math.round(fontSize * 1.1)} />
        <Wordmark fontSize={fontSize * 0.75} />
      </div>
    );
  }

  // Stacked: Symbol + Wordmark + Tagline
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <Symbol size={symbolSize * 1.2} />
        <Wordmark fontSize={fontSize * 0.7} />
        <Tagline />
      </div>
    );
  }

  return null;
};

// Export individual pieces for flexibility
export { Symbol as AQSymbol, Wordmark, Tagline };
export default Logo;
