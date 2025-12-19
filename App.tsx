import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { editImageWithGemini } from './services/geminiService';
import { AppState, GeneratedImage, SourceImage } from './types';
import { ImageComparisonModal } from './components/ImageComparisonModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Header } from './components/Header';
import { StyleSeedHelpModal } from './components/StyleSeedHelpModal';
import { getStyleDescription } from './utils/styleGenerator.ts';
import { slugify } from './utils/stringUtils.ts';
import JSZip from 'jszip';

const ASPECT_RATIOS = ['Original', '1:1', '2:3', '3:2', '3:4', '4:3', '5:4', '4:5', '9:16', '16:9', '21:9'];
const RESOLUTIONS = ['1K', '2K', '4K'];
const MAX_IMAGES = 14;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    sourceImages: [],
    generatedImages: [],
    prompt: '',
    aspectRatio: 'Original',
    resolution: '2K', // Default to 2K
    error: null,
    useGrounding: false,
    styleCode: '', 
    randomizeEachTime: false, 
  });
  
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [gridCols, setGridCols] = useState<number>(3);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showStyleDetails, setShowStyleDetails] = useState(false);
  const [showSeedHelp, setShowSeedHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const mobilePromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    };
    checkKey();

    // Check for prompt in URL params
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get('prompt');
    if (urlPrompt) {
      setState(prev => ({ ...prev, prompt: urlPrompt }));
    }
    
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024; 
      setIsMobile(mobile);
      
      if (width < 640) {
        setGridCols(1);
      } else if (width < 1024) {
        setGridCols(2); 
      } else {
        setGridCols(prev => prev < 3 ? 3 : prev);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-expand prompt textarea
  useEffect(() => {
    const adjust = (ref: React.RefObject<HTMLTextAreaElement>) => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    };
    adjust(promptRef);
    adjust(mobilePromptRef);
  }, [state.prompt, isMobileMenuOpen]);

  const handleKeySelected = () => {
    setHasApiKey(true);
  };

  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingRef.current) {
      setSidebarWidth(Math.max(280, Math.min(500, e.clientX)));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const stylePreview = useMemo(() => {
    const code = parseInt(state.styleCode, 10);
    return isNaN(code) ? null : getStyleDescription(code);
  }, [state.styleCode]);

  const getLoadingAspectRatio = useCallback((ratio: string | undefined): React.CSSProperties => {
    if (!ratio || ratio === 'Original') return { aspectRatio: '1 / 1' };
    const [w, h] = ratio.split(':');
    if (!w || !h) return { aspectRatio: '1 / 1' };
    return { aspectRatio: `${w} / ${h}` };
  }, []);

  const handleImagesSelected = useCallback((files: File[]) => {
    const remainingSlots = MAX_IMAGES - state.sourceImages.length;
    if (remainingSlots <= 0) return;

    files.slice(0, remainingSlots).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          const newImage: SourceImage = {
            id: Math.random().toString(36).substr(2, 9),
            url: e.target.result,
            file: file
          };
          setState(prev => ({
            ...prev,
            sourceImages: [...prev.sourceImages, newImage],
            error: null,
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  }, [state.sourceImages]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        handleImagesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImagesSelected]);

  const handleGenerate = async () => {
    setIsMobileMenuOpen(false); 
    if (!state.prompt.trim()) return;

    let finalPrompt = state.prompt;
    let currentCode = state.styleCode;

    if (state.randomizeEachTime) {
      currentCode = Math.floor(Math.random() * 1000000000).toString();
      setState(prev => ({ ...prev, styleCode: currentCode }));
    }

    if (currentCode) {
      const numericCode = parseInt(currentCode, 10);
      if (!isNaN(numericCode)) {
        finalPrompt += ` . ${getStyleDescription(numericCode)}`;
      }
    }

    const newId = Date.now().toString();
    const newImage: GeneratedImage = {
      id: newId,
      prompt: state.prompt,
      timestamp: Date.now(),
      status: 'loading',
      resolution: state.resolution,
      aspectRatio: state.aspectRatio,
      styleCode: currentCode ? parseInt(currentCode, 10) : undefined
    };

    setState(prev => ({
      ...prev,
      generatedImages: [newImage, ...prev.generatedImages],
    }));

    try {
      const result = await editImageWithGemini(
        state.sourceImages.map(i => ({ data: i.url, mimeType: i.file.type })),
        finalPrompt,
        state.resolution,
        state.aspectRatio,
        state.useGrounding
      );

      setState(prev => ({
        ...prev,
        generatedImages: prev.generatedImages.map(img => 
          img.id === newId ? { ...img, status: 'success', url: result.imageBase64, groundingMetadata: result.groundingMetadata } : img
        ),
      }));
    } catch (err: any) {
      if (err.message === "API_KEY_NOT_FOUND") {
        setHasApiKey(false);
      }
      setState(prev => ({
        ...prev,
        generatedImages: prev.generatedImages.map(img => 
          img.id === newId ? { ...img, status: 'error', error: err instanceof Error ? err.message : 'Generation failed' } : img
        ),
      }));
    }
  };

  const handleRepopulate = (image: GeneratedImage) => {
    setState(prev => ({
      ...prev,
      prompt: image.prompt,
      aspectRatio: image.aspectRatio || 'Original',
      resolution: image.resolution || '2K',
      styleCode: image.styleCode ? image.styleCode.toString() : '',
      useGrounding: !!image.groundingMetadata,
    }));
    // If mobile, open the menu so user sees the repopulated settings
    if (isMobile) {
      setIsMobileMenuOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleNextImage = () => {
    if (!selectedImage) return;
    const idx = state.generatedImages.findIndex(img => img.id === selectedImage.id);
    if (idx < state.generatedImages.length - 1) {
      setSelectedImage(state.generatedImages[idx + 1]);
    }
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const idx = state.generatedImages.findIndex(img => img.id === selectedImage.id);
    if (idx > 0) {
      setSelectedImage(state.generatedImages[idx - 1]);
    }
  };

  const getDomainFromUrl = (url: string, title?: string) => {
    try {
      const parsedUrl = new URL(url);
      
      // Attempt to extract from Vertex AI Search proxy if it's there
      if (parsedUrl.hostname.includes('vertexaisearch.cloud.google.com')) {
        const urlParam = parsedUrl.searchParams.get('url');
        if (urlParam) {
          return new URL(urlParam).hostname.replace(/^www\./, '');
        }
      }

      // If title looks like a domain or is a short brand name, use it
      if (title && title.length > 0 && title.length < 25) {
        if (title.includes('.')) return title.toLowerCase();
        // If it's a short title without spaces, it's often the site name
        if (!title.includes(' ')) return title;
      }

      return parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      return title || 'Link';
    }
  };

  if (hasApiKey === false) {
    return <ApiKeyModal onKeySelected={handleKeySelected} />;
  }

  const renderSidebarControls = (isMobileView: boolean = false) => (
    <div className="space-y-5">
      <section className="space-y-1">
        <header className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-monstera-800 uppercase tracking-widest">Prompt</label>
          <span className="text-[8px] font-bold text-monstera-400 uppercase tracking-widest">↵ to run</span>
        </header>
        <textarea
          ref={isMobileView ? mobilePromptRef : promptRef}
          value={state.prompt}
          onChange={(e) => setState(p => ({ ...p, prompt: e.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder=""
          className="w-full min-h-[96px] max-h-[300px] bg-white border border-monstera-200 rounded-md p-3 text-[13px] font-medium placeholder-monstera-300 focus:bg-white focus:border-monstera-400 transition-all outline-none resize-none leading-relaxed shadow-inner overflow-y-auto custom-scrollbar"
        />
      </section>

      <section className="space-y-1.5">
        <label className="text-[10px] font-black text-monstera-800 uppercase tracking-widest px-1 block">References</label>
        <div className="grid grid-cols-2 gap-1.5">
          {state.sourceImages.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-monstera-200 bg-monstera-50 shadow-sm transition-all hover:border-monstera-300">
              <img src={img.url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <button 
                  onClick={() => setState(p => ({ ...p, sourceImages: p.sourceImages.filter(i => i.id !== img.id) }))}
                  className="bg-white text-ink p-1.5 rounded-md shadow-xl"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          {state.sourceImages.length < MAX_IMAGES && (
            <ImageUpload onImagesSelected={handleImagesSelected} compact={true} remainingSlots={MAX_IMAGES - state.sourceImages.length} />
          )}
        </div>
      </section>

      <section className="bg-white border border-monstera-200 rounded-md shadow-md overflow-hidden">
        <div className="bg-monstera-50 border-b border-monstera-200 px-3 py-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-monstera-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            <span className="text-[10px] font-black text-monstera-800 uppercase tracking-widest">Generation Settings</span>
        </div>
        
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-monstera-800 font-black uppercase tracking-widest px-1">Aspect ratio</label>
              <div className="relative">
                <select
                  value={state.aspectRatio}
                  onChange={(e) => setState(p => ({ ...p, aspectRatio: e.target.value }))}
                  className="w-full bg-white border border-monstera-200 text-[11px] font-bold rounded-md px-2.5 py-1.5 outline-none cursor-pointer hover:border-monstera-300 appearance-none shadow-sm"
                >
                  {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-monstera-800 font-black uppercase tracking-widest px-1">Resolution</label>
              <div className="relative">
                <select
                  value={state.resolution}
                  onChange={(e) => setState(p => ({ ...p, resolution: e.target.value }))}
                  className="w-full bg-white border border-monstera-200 text-[11px] font-bold rounded-md px-2.5 py-1.5 outline-none cursor-pointer hover:border-monstera-300 appearance-none shadow-sm"
                >
                  {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <label className="text-[9px] text-monstera-800 font-black uppercase tracking-widest">Style Seed</label>
              <button 
                onClick={() => setShowSeedHelp(true)}
                className="text-monstera-400 hover:text-monstera-600 transition-colors"
                title="What is this?"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={state.styleCode}
                disabled={state.randomizeEachTime}
                onChange={(e) => setState(p => ({ ...p, styleCode: e.target.value.replace(/\D/g, '') }))}
                className={`w-full bg-white border border-monstera-200 text-xs font-mono font-bold rounded-md pl-3 pr-8 py-1.5 outline-none focus:border-monstera-400 shadow-sm transition-all ${state.randomizeEachTime ? 'bg-monstera-50 text-monstera-400 select-none' : ''}`}
                placeholder={state.randomizeEachTime ? "Randomizing each run..." : "Optional Seed"}
              />
              {!state.randomizeEachTime && (
                <button
                  onClick={() => setState(p => ({ ...p, styleCode: Math.floor(Math.random() * 1000000000).toString() }))}
                  className="absolute right-1 top-1 text-monstera-400 hover:text-monstera-600 p-1 hover:bg-monstera-50 rounded transition-all"
                  title="Generate random seed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              )}
            </div>

            {stylePreview && !state.randomizeEachTime && (
              <div className="pb-1">
                <button 
                  onClick={() => setShowStyleDetails(!showStyleDetails)}
                  className="flex items-center gap-1 text-[8px] font-bold text-monstera-400 hover:text-monstera-600 uppercase tracking-wider transition-colors select-none"
                >
                  <span>{showStyleDetails ? 'Hide' : 'Show'} Style Prompt</span>
                  <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${showStyleDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showStyleDetails && (
                  <div className="mt-1.5 p-2 bg-monstera-50 border border-monstera-100 rounded text-[9px] font-medium leading-relaxed text-monstera-700 animate-fadeIn">
                    {stylePreview}
                  </div>
                )}
              </div>
            )}
            
            <label className="flex items-center gap-2.5 cursor-pointer group px-1 select-none">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={state.randomizeEachTime}
                  onChange={(e) => setState(p => ({ ...p, randomizeEachTime: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-7 h-3.5 bg-monstera-200 rounded-full peer-checked:bg-monstera-400 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform peer-checked:translate-x-3 shadow-sm"></div>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide transition-colors ${state.randomizeEachTime ? 'text-ink' : 'text-monstera-600 group-hover:text-ink'}`}>New seed every run</span>
            </label>

            <div className="border-t border-monstera-200 mt-2 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group px-1">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={state.useGrounding}
                    onChange={(e) => setState(p => ({ ...p, useGrounding: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-3.5 bg-monstera-200 rounded-full peer-checked:bg-monstera-400 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform peer-checked:translate-x-3 shadow-sm"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-wide text-monstera-800 group-hover:text-ink transition-colors">Search Grounding</span>
                  <span className="text-[7px] font-bold text-monstera-400 uppercase tracking-widest leading-none">Slower generation</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4 pb-2 flex items-center justify-center gap-1 text-[9px] font-bold text-monstera-400 uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity">
          <span className="opacity-50">Made by</span>
          <a href="https://fofr.ai" target="_blank" rel="noopener noreferrer" className="hover:text-monstera-600 transition-colors">fofr</a>
          <span className="opacity-30 mx-1">•</span>
          <a href="https://x.com/fofrAI" target="_blank" rel="noopener noreferrer" className="hover:text-monstera-600 transition-colors">@fofrAI</a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white text-ink font-sans selection:bg-monstera-200">
      
      <div 
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className="hidden lg:flex shrink-0 border-r border-monstera-200 bg-paper flex-col z-20 h-full relative shadow-sm"
      >
        <Header />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {renderSidebarControls(false)}
        </div>

        <div className="p-4 border-t border-monstera-200 bg-paper/80 backdrop-blur-xl">
          <button
            onClick={handleGenerate}
            disabled={!state.prompt.trim()}
            className="w-full py-3 px-6 bg-gradient-to-br from-monstera-300 to-monstera-400 hover:from-ink hover:to-monstera-900 hover:text-white text-ink font-[900] text-[13px] uppercase tracking-[0.2em] border-2 border-ink rounded-md transition-all shadow-[5px_5px_0_rgba(13,33,23,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale"
          >
            Generate
          </button>
        </div>
      </div>

      <div 
        className="w-1 bg-transparent hover:bg-monstera-300/60 transition-colors z-30 hidden lg:block cursor-col-resize active:bg-monstera-300 h-full"
        onMouseDown={startResizing}
      />

      <main className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white relative flex flex-col">
        <div className="lg:hidden">
          <Header />
        </div>

        <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-y border-monstera-200 shadow-sm p-3 flex gap-3 items-center transition-all">
          <div 
            className="flex-1 bg-monstera-50 border border-monstera-200 rounded-md px-3 py-2 text-xs font-medium text-ink truncate cursor-text hover:bg-white hover:border-monstera-300 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            {state.prompt || "Enter a prompt..."}
          </div>
          <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 bg-white rounded-md border border-monstera-200 text-monstera-600 hover:text-ink hover:border-monstera-400 transition-colors"
             title="Settings"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
          <button
             onClick={handleGenerate}
             disabled={!state.prompt.trim()}
             className="bg-monstera-400 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-md border border-ink shadow-[2px_2px_0_rgba(13,33,23,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:grayscale"
          >
             Go
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-paper flex flex-col animate-fadeIn">
             <div className="flex items-center justify-between p-4 border-b border-monstera-200 bg-white">
                <span className="font-black uppercase tracking-widest text-xs text-ink">Configuration</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-monstera-600 hover:text-ink bg-white border border-monstera-200 rounded-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 pb-20 custom-scrollbar">
                {renderSidebarControls(true)}
             </div>
             <div className="p-5 border-t border-monstera-200 bg-paper absolute bottom-0 left-0 right-0">
                <button
                  onClick={handleGenerate}
                  disabled={!state.prompt.trim()}
                  className="w-full py-3.5 px-6 bg-monstera-400 text-ink font-[900] text-[13px] uppercase tracking-[0.2em] border-2 border-ink rounded-md transition-all shadow-[4px_4px_0_rgba(13,33,23,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-20 disabled:grayscale"
                >
                  Generate
                </button>
             </div>
          </div>
        )}

        <div className="p-4 lg:px-10 lg:pt-6 lg:pb-10 space-y-6 md:space-y-8 max-w-[1800px] mx-auto w-full">
          <header className="hidden lg:flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-ink rounded-full"></div>
                <h2 className="text-[11px] font-[900] uppercase tracking-[0.3em] text-ink">Gallery</h2>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 hidden lg:flex">
              <div className="flex items-center gap-1.5 bg-monstera-50 p-1 rounded-md border border-monstera-200 shadow-sm">
                <span className="text-[8px] font-black uppercase opacity-40 px-2">Grid</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setGridCols(n)} 
                      className={`w-7 h-7 rounded-md font-black text-[10px] transition-all flex items-center justify-center ${gridCols === n ? 'bg-white text-ink shadow-sm border border-monstera-200' : 'text-monstera-600 hover:text-ink hover:bg-white/50'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {state.generatedImages.length > 0 && (
                <button 
                  onClick={async () => {
                    const successImages = state.generatedImages.filter(img => img.status === 'success' && img.url);
                    if (successImages.length === 0) return;
                    setDownloadingAll(true);
                    const zip = new JSZip();
                    const folderName = `nano-banana-pro-${Date.now()}`;
                    const folder = zip.folder(folderName);
                    await Promise.all(successImages.map(async img => {
                      const res = await fetch(img.url!);
                      const blob = await res.blob();
                      const slug = slugify(img.prompt);
                      const stylePart = img.styleCode ? `-${img.styleCode}` : '';
                      const baseFilename = `${img.id}${stylePart}${slug ? '-' + slug : ''}`;
                      folder!.file(`${baseFilename}.jpg`, blob);

                      const styleDesc = (img.styleCode !== undefined && img.styleCode !== null) ? getStyleDescription(img.styleCode) : null;

                      const metadata = [
                        `Prompt: ${img.prompt}`,
                        styleDesc ? `Style Prompt: ${styleDesc}` : '',
                        `Resolution: ${img.resolution || 'N/A'}`,
                        `Aspect Ratio: ${img.aspectRatio || 'N/A'}`,
                        `Style Seed: ${img.styleCode ?? 'None'}`,
                        `Timestamp: ${new Date(img.timestamp).toLocaleString()}`,
                        `ID: ${img.id}`,
                        img.groundingMetadata ? `Grounding Metadata: ${JSON.stringify(img.groundingMetadata, null, 2)}` : ''
                      ].filter(Boolean).join('\n');

                      folder!.file(`${baseFilename}.txt`, metadata);
                    }));
                    const content = await zip.generateAsync({type:"blob"});
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `${folderName}.zip`;
                    link.click();
                    setDownloadingAll(false);
                  }}
                  disabled={downloadingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-ink font-black text-[9px] uppercase tracking-widest rounded-md border border-monstera-200 hover:border-ink shadow-sm transition-all active:scale-95"
                >
                  {downloadingAll ? (
                    <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  {downloadingAll ? 'Packing...' : 'Export All'}
                </button>
              )}
            </div>
          </header>

          {state.generatedImages.length === 0 ? (
            <div className="py-20 md:py-40 flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-monstera-50 rounded-md flex items-center justify-center grayscale opacity-20 border border-monstera-200 shadow-inner">
                <span className="text-3xl">🍌</span>
              </div>
              <div className="text-center space-y-2">
                <span className="text-lg font-bold text-ink block">No images generated yet</span>
              </div>
              <div className="pt-4 flex items-center justify-center gap-1 text-[9px] font-bold text-monstera-400 uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                  <span className="opacity-50">Made by</span>
                  <a href="https://fofr.ai" target="_blank" rel="noopener noreferrer" className="hover:text-monstera-600 transition-colors">fofr</a>
                  <span className="opacity-30 mx-1">•</span>
                  <a href="https://x.com/fofrAI" target="_blank" rel="noopener noreferrer" className="hover:text-monstera-600 transition-colors">@fofrAI</a>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
              {state.generatedImages.map((image) => (
                <article key={image.id} className="group flex flex-col bg-white border border-monstera-200 rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fadeIn">
                  <div 
                    className={`relative bg-monstera-50 cursor-zoom-in ${gridCols === 1 ? '' : 'aspect-square'}`} 
                    style={gridCols === 1 && image.status !== 'success' ? getLoadingAspectRatio(image.aspectRatio) : undefined}
                    onClick={() => setSelectedImage(image)}
                  >
                    {image.status === 'loading' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      image.url && (
                        <div className={`w-full ${gridCols === 1 ? '' : 'h-full'} p-2 flex items-center justify-center`}>
                          <img 
                            src={image.url} 
                            className={gridCols === 1 ? "w-full h-auto rounded-sm" : "max-w-full max-h-full object-contain"} 
                            loading="lazy" 
                          />
                        </div>
                      )
                    )}
                    
                    {image.status === 'error' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-10 h-10 bg-red-500 text-white rounded-md flex items-center justify-center mb-4 shadow-lg">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h4 className="text-red-700 font-[900] uppercase text-[9px] mb-2 tracking-[0.2em]">Error</h4>
                        <p className="text-[8px] font-bold text-red-500 leading-relaxed max-w-[150px]">{image.error}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-3 py-2.5 flex flex-col gap-2 border-t border-monstera-200 bg-white">
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-bold text-ink leading-snug line-clamp-1 flex-1" title={image.prompt}>
                        {image.prompt}
                      </p>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(image.prompt); }} 
                          className="p-2 text-monstera-400 hover:text-ink hover:bg-monstera-100 rounded-md transition-all border border-transparent hover:border-monstera-200" 
                          title="Copy Prompt"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRepopulate(image); }} 
                          className="p-2 text-monstera-400 hover:text-ink hover:bg-monstera-100 rounded-md transition-all border border-transparent hover:border-monstera-200" 
                          title="Use Settings"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </button>
                        {image.url && (
                          <a 
                            href={image.url} 
                            download={`${image.id}${image.styleCode ? '-' + image.styleCode : ''}${slugify(image.prompt) ? '-' + slugify(image.prompt) : ''}.jpg`} 
                            className="p-2 text-monstera-400 hover:text-ink hover:bg-monstera-100 rounded-md transition-all border border-transparent hover:border-monstera-200" 
                            title="Download"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                        )}
                      </div>
                    </div>
                    {image.groundingMetadata?.groundingChunks && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {image.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                          chunk.web?.uri && (
                            <a 
                              key={i}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-monstera-50 text-monstera-600 hover:bg-monstera-200 hover:text-ink rounded border border-monstera-200 transition-all truncate max-w-full"
                              title={chunk.web.title || chunk.web.uri}
                            >
                              {getDomainFromUrl(chunk.web.uri, chunk.web.title)}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <ImageComparisonModal 
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        generatedImage={selectedImage?.url || null}
        originalImage={state.sourceImages[0]?.url || null}
        prompt={selectedImage?.prompt || ''}
        timestamp={selectedImage?.timestamp || 0}
        resolution={selectedImage?.resolution}
        aspectRatio={selectedImage?.aspectRatio}
        styleCode={selectedImage?.styleCode}
        groundingMetadata={selectedImage?.groundingMetadata}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        hasNext={selectedImage ? state.generatedImages.findIndex(img => img.id === selectedImage.id) < state.generatedImages.length - 1 : false}
        hasPrev={selectedImage ? state.generatedImages.findIndex(img => img.id === selectedImage.id) > 0 : false}
      />
      
      {showSeedHelp && <StyleSeedHelpModal onClose={() => setShowSeedHelp(false)} />}
    </div>
  );
};

export default App;