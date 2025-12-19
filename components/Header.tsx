import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="flex items-center gap-3 bg-ink px-6 py-5 w-full select-none shrink-0">
      <div className="w-8 h-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf text-monstera-400 fill-monstera-900 w-full h-full" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
        </svg>
      </div>
      <h1 className="text-lg md:text-xl font-serif font-bold text-white tracking-tight leading-none whitespace-nowrap">
        Nano Banana Pro explorer
      </h1>
    </div>
  );
};