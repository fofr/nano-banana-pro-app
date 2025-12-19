import React from 'react';

interface StyleSeedHelpModalProps {
  onClose: () => void;
}

export const StyleSeedHelpModal: React.FC<StyleSeedHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 backdrop-blur-[2px] p-6 animate-fade" onClick={onClose}>
      <div 
        className="max-w-md w-full bg-white border border-monstera-200 rounded-md shadow-2xl flex flex-col items-start text-left relative overflow-hidden animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full bg-monstera-50 border-b border-monstera-200 px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <svg className="w-4 h-4 text-monstera-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black text-monstera-800 uppercase tracking-widest">Style Seed</span>
           </div>
           <button 
            onClick={onClose}
            className="text-monstera-400 hover:text-ink transition-colors"
           >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="p-6 space-y-4 text-sm font-medium text-ink leading-relaxed">
          <p>
            The Style Seed is a numerical key that determines an aesthetic. When present, it deterministically selects a unique combination of five aesthetic pillars:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-ink marker:text-monstera-400">
            <li>Visual Vibes & Art Movements</li>
            <li>Lighting Conditions</li>
            <li>Color Palettes</li>
            <li>Surface Textures</li>
            <li>Compositional Flows</li>
          </ul>
          <p>
            Using the same seed guarantees the exact same set of artistic constraints are applied to your prompt. This allows you to reproduce specific styles across different subjects or maintain consistency in a series of generations.
          </p>
        </div>

        <div className="p-4 w-full border-t border-monstera-200 bg-monstera-50/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-ink hover:bg-monstera-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-md transition-all shadow-sm active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};