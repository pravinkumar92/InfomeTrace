import React from 'react';

export const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-canvas">
      
      {/* Central Watermark Branding */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.04]">
        <h1 className="text-[12vw] font-bold tracking-widest text-ink leading-none select-none">
          INFOMETRACE
        </h1>
        <p className="text-[1.5vw] font-bold tracking-[0.4em] text-maroon uppercase mt-4 select-none">
          Food Safety Command Center
          Supply Chain Recall Intelligence
        </p>
      </div>

      {/* Abstract Animated Data Flow */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1920 1080">
        
        {/* Layer 1: Large sweeping burgundy arcs */}
        <g className="animate-flow-slow">
          <path d="M-200,800 C400,600 800,1200 1400,400 S2200,600 2400,200" fill="none" stroke="#3B1118" strokeWidth="80" strokeLinecap="round" />
          <path d="M-100,1000 C500,800 900,1400 1500,600 S2300,800 2500,400" fill="none" stroke="#3B1118" strokeWidth="40" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Layer 2: Muted blue interconnecting lines moving diagonally */}
        <g className="animate-flow-medium">
          <path d="M-300,200 C300,500 600,-100 1200,300 S1800,-200 2200,100" fill="none" stroke="#315C7D" strokeWidth="20" strokeLinecap="round" />
          <path d="M200,1200 C600,900 1000,1500 1600,1100 S2200,1300 2600,900" fill="none" stroke="#315C7D" strokeWidth="15" strokeLinecap="round" />
        </g>

        {/* Layer 3: Subtle maroon structural ribbons */}
        <g className="animate-flow-slow-reverse">
          <path d="M-200,400 C400,600 1000,0 1600,600 S2200,200 2400,800" fill="none" stroke="#6E1F2A" strokeWidth="120" strokeLinecap="round" opacity="0.3" />
        </g>

        {/* Layer 4: Intelligence nodes and structural data paths */}
        <g className="animate-pulse-very-slow">
          <circle cx="400" cy="550" r="12" fill="#171719" />
          <circle cx="1200" cy="350" r="18" fill="#171719" />
          <circle cx="1600" cy="800" r="14" fill="#3B1118" />
          <circle cx="800" cy="900" r="10" fill="#315C7D" />
          
          <path d="M400,550 L1200,350 L1600,800 L800,900 Z" fill="none" stroke="#171719" strokeWidth="2" strokeDasharray="10 20" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
};
