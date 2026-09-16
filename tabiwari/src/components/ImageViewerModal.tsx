import React from 'react';
import { X } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  caption,
  onClose,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        id="image-viewer-container"
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="image-viewer-close-btn"
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          title="關閉相片"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={imageUrl}
          alt={caption || 'Travel photo'}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
        />

        {caption && (
          <p className="mt-3 text-xs sm:text-sm text-[#EAE3D8] text-center font-sans tracking-wide">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
