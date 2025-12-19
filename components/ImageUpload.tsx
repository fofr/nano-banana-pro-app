import React, { useCallback, useState } from 'react';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  compact?: boolean;
  remainingSlots?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesSelected, 
  compact = false,
  remainingSlots = 14 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length > 0) onImagesSelected(validFiles);
  }, [onImagesSelected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const commonClasses = `relative group cursor-pointer transition-all duration-300 border rounded-md flex flex-col items-center justify-center ${
    isDragging 
      ? 'border-monstera-400 bg-monstera-50 scale-[1.01] border-2 shadow-lg shadow-monstera-400/10' 
      : 'border-dashed border-monstera-200 bg-monstera-50/20 hover:border-monstera-300 hover:bg-white hover:shadow-md'
  }`;

  if (compact) {
    return (
      <div
        className={`${commonClasses} aspect-square h-full p-4 text-center`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="" />
        <div className="bg-monstera-100 p-2 rounded-md group-hover:bg-monstera-400 group-hover:text-white text-monstera-400 transition-all mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-monstera-600 group-hover:text-ink uppercase tracking-tighter">
            Add
          </span>
          <span className="text-[8px] font-bold text-monstera-400 uppercase tracking-widest">
            ({remainingSlots})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${commonClasses} h-64 w-full text-center p-8`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="" />
      <div className="bg-monstera-300 text-ink p-5 rounded-md mb-4 shadow-xl shadow-monstera-300/20 transform group-hover:scale-105 transition-all">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <h3 className="text-xs font-black text-ink uppercase tracking-[0.2em]">Upload Reference</h3>
      <p className="text-[9px] font-bold text-monstera-600 uppercase tracking-[0.2em] mt-2">Up to {remainingSlots} assets</p>
    </div>
  );
};