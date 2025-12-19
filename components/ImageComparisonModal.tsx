import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { slugify } from '../utils/stringUtils';
import { getStyleDescription } from '../utils/styleGenerator';

interface ImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string | null;
  generatedImage: string | null;
  prompt: string;
  timestamp?: number;
  resolution?: string;
  aspectRatio?: string;
  styleCode?: number;
  groundingMetadata?: any;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ImageComparisonModal: React.FC<ImageComparisonModalProps> = ({
  isOpen, onClose, originalImage, generatedImage, prompt, timestamp,
  resolution, aspectRatio, styleCode, groundingMetadata,
  onNext, onPrev, hasNext, hasPrev
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  // Reset state when image changes
  useEffect(() => {
    setShowFullPrompt(false);
    // Don't auto-close drawer when navigating between images on mobile to keep flow smooth
  }, [generatedImage]);

  const displayedPrompt = useMemo(() => {
    if (showFullPrompt && styleCode !== undefined && styleCode !== null) {
      return `${prompt} ${getStyleDescription(styleCode)}`;
    }
    return prompt;
  }, [prompt, showFullPrompt, styleCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedPrompt);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const slug = slugify(prompt);
    const time = timestamp || Date.now();
    const stylePart = styleCode ? `-${styleCode}` : '';
    link.download = `${time}${stylePart}${slug ? '-' + slug : ''}.jpg`;
    link.click();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && hasNext) onNext?.();
    if (isRightSwipe && hasPrev) onPrev?.();
  };

  const toggleDrawer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (!isOpen || !generatedImage) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col md:flex-row animate-fadeIn bg-ink">
      
      {/* Left Panel: Image Viewer */}
      <div 
        className="relative w-full h-full md:flex-1 flex items-center justify-center bg-black/40 overflow-hidden pb-[60px] md:pb-0" 
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        {/* Navigation Arrows */}
        {hasPrev && (
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white/70 bg-black/20 backdrop-blur-sm hover:text-white hover:bg-black/40 rounded-full transition-all"
            aria-label="Previous Image"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        {hasNext && (
          <button 
            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white/70 bg-black/20 backdrop-blur-sm hover:text-white hover:bg-black/40 rounded-full transition-all"
            aria-label="Next Image"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Image Content */}
        <div className="relative w-full h-full p-4 md:py-12 md:px-24 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="relative w-full h-full flex items-center justify-center">
            {isCompareMode && originalImage ? (
              <div 
                ref={containerRef} 
                className="relative h-full max-w-full aspect-[var(--aspect-ratio)] select-none cursor-col-resize shadow-2xl mx-auto" 
                style={{ aspectRatio: 'auto' }}
                onMouseDown={() => setIsDragging(true)}
              >
                <img src={generatedImage} className="max-w-full max-h-full object-contain pointer-events-none select-none block mx-auto" draggable={false} />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}>
                  <img src={originalImage} className="max-w-full max-h-full object-contain pointer-events-none select-none block mx-auto" draggable={false} />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-monstera-400 z-20 cursor-col-resize" style={{ left: `${sliderPosition}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-monstera-400 border-2 border-ink rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" /></svg>
                  </div>
                </div>
              </div>
            ) : (
              <img src={generatedImage} className="max-w-full max-h-full object-contain shadow-2xl" />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Sidebar / Drawer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[160] bg-ink border-t border-white/10 shadow-2xl transition-all duration-300 ease-in-out md:static md:w-[400px] md:h-full md:border-t-0 md:border-l flex flex-col ${isDrawerOpen ? 'h-[80vh]' : 'h-[60px]'} md:h-full`}
        onClick={(e) => {
          e.stopPropagation();
          // Expand on click if on mobile and closed
          if (window.innerWidth < 768 && !isDrawerOpen) setIsDrawerOpen(true);
        }}
      >
        
        {/* Sidebar Header */}
        <div 
          className="flex items-center justify-between px-6 h-[60px] shrink-0 cursor-pointer md:cursor-default"
          onClick={toggleDrawer}
        >
           <div className="flex items-center gap-2 text-monstera-300">
              <div className="md:hidden">
                {isDrawerOpen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                )}
              </div>
              <span className="font-black tracking-[0.2em] text-xs">DETAILS</span>
           </div>
           <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all" 
                title="Close"
              >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 space-y-6">
           <div className="space-y-2">
             <div className="flex items-center justify-between">
                <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Prompt</h4>
                <button 
                  onClick={handleCopy} 
                  className="p-1.5 text-monstera-400 hover:text-white hover:bg-white/10 rounded-md transition-all" 
                  title="Copy Prompt"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
             </div>
             <p className="text-monstera-50/90 font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-monstera-400 selection:text-ink">
               {displayedPrompt}
             </p>
           </div>

           <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Resolution</h4>
                    <p className="text-monstera-50 font-mono text-xs">{resolution || 'Default'}</p>
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Aspect Ratio</h4>
                    <p className="text-monstera-50 font-mono text-xs">{aspectRatio || 'Original'}</p>
                 </div>
              </div>
              
              {styleCode !== undefined && styleCode !== null && (
                <div className="space-y-1">
                   <div className="flex items-center justify-between">
                     <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Style Seed</h4>
                     <label className="flex items-center gap-1.5 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={showFullPrompt} 
                            onChange={e => setShowFullPrompt(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-6 h-3 bg-white/20 rounded-full peer-checked:bg-monstera-400 transition-colors"></div>
                          <div className="absolute left-0.5 w-2 h-2 bg-white rounded-full transition-transform peer-checked:translate-x-3"></div>
                        </div>
                        <span className="text-[8px] text-monstera-400 font-bold uppercase group-hover:text-monstera-300 transition-colors">Show full prompt</span>
                     </label>
                   </div>
                   <p className="text-monstera-50 font-mono text-xs">{styleCode}</p>
                </div>
              )}

              {groundingMetadata && (
                 <div className="space-y-1">
                    <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Grounding</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-monstera-400 text-ink">
                       Enabled
                    </span>
                 </div>
              )}
           </div>
        </div>

        {/* Sidebar Footer (Actions) */}
        <div className="p-6 border-t border-white/5 flex flex-col gap-3 shrink-0 bg-ink">
           {originalImage && (
             <button 
               onClick={() => setIsCompareMode(!isCompareMode)}
               className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${isCompareMode ? 'bg-monstera-400 text-ink border-monstera-400' : 'bg-transparent text-white border-white/20 hover:border-white'}`}
             >
               {isCompareMode ? 'Exit Comparison' : 'Compare Original'}
             </button>
           )}
           <button 
             onClick={handleDownload}
             className="w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest border-2 bg-white text-ink border-white hover:bg-monstera-300 hover:border-monstera-300 transition-all shadow-lg active:scale-95"
           >
             Download Image
           </button>
        </div>

      </div>
    </div>
  );
};