import React from 'react';
import { 
  Plus, Upload, ArrowLeft, RefreshCw, Sun, Moon, Palette
} from 'lucide-react';
import { Trip, AppBranding } from '../types';
import { ThemeMode } from '../utils/storage';

interface HeaderProps {
  trips: Trip[];
  theme: ThemeMode;
  branding: AppBranding;
  saveStatus: 'saved' | 'saving';
  lastSavedTime: string;
  onToggleTheme: () => void;
  onNewTrip: () => void;
  onOpenBackup: () => void;
  onHomeClick: () => void;
  onOpenCustomLogo: () => void;
  onOpenLiveRates: () => void;
  isInsideTrip?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  branding,
  saveStatus,
  onToggleTheme,
  onNewTrip,
  onOpenBackup,
  onHomeClick,
  onOpenCustomLogo,
  onOpenLiveRates,
  isInsideTrip = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#191715]/90 border-[#38312A] text-[#EDE7DF]'
          : 'bg-[#FAF8F3]/90 border-[#EAE3D8] text-[#2C2622]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & App Name */}
        <div className="flex items-center gap-3">
          {isInsideTrip && (
            <button
              id="header-back-btn"
              onClick={onHomeClick}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#25211E] border-[#3D352D] hover:bg-[#332C28]'
                  : 'bg-white border-[#E5DDCF] hover:bg-[#F5EFE6]'
              }`}
              title="返回旅程目錄"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div
            onClick={onHomeClick}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            {/* 改為預設讀取 /apple-touch-icon.png 圖片 */}
            <img 
              src="/apple-touch-icon.png?v=2" 
              alt="旅割 Logo" 
              className="w-9 h-9 rounded-xl object-cover border border-amber-900/20 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-mincho font-bold text-base sm:text-lg tracking-wide leading-none">
                {branding?.appName || '旅割'}
              </span>
              <span className="text-[10px] opacity-60 tracking-widest font-sans mt-0.5">
                TABI-WARI
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2">
          {/* 匯率面板 */}
          <button
            id="header-live-rates-btn"
            onClick={onOpenLiveRates}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'bg-[#25211E] border-[#3D352D] text-[#D4A373] hover:bg-[#332C28]'
                : 'bg-white border-[#E5DDCF] text-[#8C6E54] hover:bg-[#F5EFE6]'
            }`}
            title="即時匯率看板"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">匯率</span>
          </button>

          {/* 新增旅程按鈕 */}
          <button
            id="header-new-trip-btn"
            onClick={onNewTrip}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
              isDark
                ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新旅行記帳</span>
          </button>
        </div>

      </div>
    </header>
  );
};
