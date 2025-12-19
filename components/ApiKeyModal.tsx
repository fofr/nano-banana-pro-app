import React from 'react';

interface ApiKeyModalProps {
  onKeySelected: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected }) => {
  const handleOpenKeyPicker = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success after triggering the picker
      onKeySelected();
    } catch (err) {
      console.error("Failed to open key picker", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 backdrop-blur-[2px] p-6 animate-fade">
      <div className="max-w-md w-full bg-white border border-monstera-200 rounded-md shadow-2xl flex flex-col items-start text-left relative overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="w-full bg-monstera-50 border-b border-monstera-200 px-4 py-3 flex items-center gap-2">
           <span className="text-base">🍌</span>
           <span className="text-[10px] font-black text-monstera-800 uppercase tracking-widest">Nano Banana Pro</span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-base font-medium text-ink leading-relaxed">
          <p>
            To run Nano Banana Pro, you must select an API key from a paid GCP project.
          </p>
          <p>
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline hover:text-monstera-500 transition-colors font-bold"
            >
              Learn about billing
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 w-full border-t border-monstera-200 bg-monstera-50/50">
          <button
            onClick={handleOpenKeyPicker}
            className="w-full py-3 bg-ink hover:bg-monstera-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-md transition-all shadow-sm active:scale-[0.98]"
          >
            Select API Key
          </button>
        </div>

      </div>
    </div>
  );
};