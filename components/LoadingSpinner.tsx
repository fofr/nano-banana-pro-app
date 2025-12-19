import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 h-full">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border-[6px] border-ink opacity-5 rounded-full"></div>
        <div className="absolute inset-0 border-[6px] border-monstera-400 rounded-full animate-spin border-t-transparent shadow-[2px_2px_0_rgba(0,0,0,0.02)]"></div>
      </div>
      <p className="text-[9px] font-black text-monstera-400 uppercase tracking-[0.4em] animate-pulse">Running...</p>
    </div>
  );
};