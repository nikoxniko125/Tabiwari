import React, { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { AppBranding } from '../types';

interface CustomLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: AppBranding;
  onSaveBranding: (newBranding: AppBranding) => void;
  isDark: boolean;
}

export const CustomLogoModal: React.FC<CustomLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  isDark,
}) => {
  const [appName, setAppName] = useState(branding?.appName || '旅割');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveBranding({
      ...branding,
      appName: appName.trim() || '旅割',
      customIconUrl: '/apple-touch-icon.png?v=2',
    });
    onClose();
  };

  const handleReset = () => {
    setAppName('旅割');
    onSaveBranding({
      appName: '旅割',
      customIconUrl: '/apple-touch-icon.png?v=2',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#38312A] text-[#EDE7DF]'
            : 'bg-[#FFFFFF] border-[#EAE3D8] text-[#2C2622]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h3 className="text-base font-mincho font-bold">自訂 App 標題與圖示</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview Card */}
          <div
            className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center ${
              isDark ? 'bg-[#1C1A17] border-[#332C25]' : 'bg-[#FAF8F3] border-[#EAE3D8]'
            }`}
          >
            <span className="text-xs opacity-60">iPhone 主畫面效果預覽</span>
            
            {/* 圖示預覽：預設顯示專屬和紙鳥居金幣 Icon */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border border-amber-900/20">
              <img
                src="/apple-touch-icon.png?v=2"
                alt="App Icon Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <span className="font-mincho font-bold text-lg mt-1">
              {appName || '旅割'}
            </span>
          </div>

          {/* Input App Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-80">App 名稱（顯示於 Header 與標題）</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="例如：旅割、東京之旅..."
              maxLength={12}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                  : 'bg-white border-[#E2D9CC] text-[#2C2622] focus:border-[#8C6E54]'
              }`}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-medium opacity-70 hover:opacity-100 flex items-center gap-1.5 transition-opacity"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置預設</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 dark:border-stone-700 opacity-80 hover:opacity-100 transition-opacity"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存修改</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
