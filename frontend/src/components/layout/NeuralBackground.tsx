import React from 'react';

/**
 * Stark Black, Pure White, Charcoal Gray Minimal Ambient Layer.
 * Subtle noise/depth with monochrome gradients that eliminate all blue/purple tints.
 */
export const NeuralBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      {/* Subtle fine grid texture */}
      <div className="absolute inset-0 bg-grid-subtle opacity-70" />
      
      {/* Top subtle white/charcoal ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-white/[0.04] via-charcoal-700/[0.02] to-transparent rounded-full blur-[140px]" />
      
      {/* Lateral charcoal vignette */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-charcoal-800/[0.04] rounded-full blur-[160px]" />
    </div>
  );
};

export default NeuralBackground;
