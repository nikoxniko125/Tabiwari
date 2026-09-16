import React from 'react';
import { 
  Compass, Plus, Users, ReceiptText, 
  TrendingUp, Palette, Plane, Camera, Mountain, Coffee, Luggage, Coins,
  Sliders
} from 'lucide-react';
import { Trip, AppBranding } from '../types';
import { ThemeMode } from '../utils/storage';

interface HeaderProps {
  trips: Trip[];
  theme: ThemeMode;
  branding?: AppBranding;
  saveStatus?: 'saved' | 'saving';
  lastSavedTime?: string;
  onToggleTheme?: () => void;
  onNewTrip: () => void;
  onOpenBackup?: () => void;
  onHomeClick: () => void;
  onOpenCustomLogo?: () => void;
  onOpenLiveRates?: () => void;
  isInsideTrip?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  trips,
  theme,
  branding,
  saveStatus = 'saved',
  lastSavedTime,
  onToggleTheme,
  onNewTrip,
  onOpenBackup,
  onHomeClick,
  onOpenCustomLogo,
  onOpenLiveRates,
  isInsideTrip = false,
}) => {
  const isDark = theme === 'dark';

  // Aggregate stats
  const totalTrips = trips.length;
  const totalExpensesCount = trips.reduce((acc, t) => acc + (t.expenses?.length || 0), 0);
  const totalMembers = new Set(
    trips.flatMap((t) => (t.participants || []).map((p) => p.name))
  ).size;

  // Render dynamic logo icon
  const renderLogoIcon = () => {
    if (!branding) return <Compass className="w-5 h-5" />;

    if (branding.logoType === 'image' && branding.customImageUrl) {
      return (
        <img
          src={branding.customImageUrl}
          alt={branding.appName}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }

    if (branding.logoType === 'emoji') {
      return <span className="text-xl leading-none select-none">{branding.customEmoji || '🌸'}</span>;
    }

    // Preset icon by id
    const presetMap: Record<string, string> = {
      compass: '🧭',
      sakura: '🌸',
      fuji: '🗻',
      torii: '⛩️',
      matcha: '🍵',
      onsen: '♨️',
      shinkansen: '🚅',
      lantern: '🏮',
      cat: '🐱',
      onigiri: '🍙',
      wallet: '💴',
      flight: '✈️',
    };

    const emoji = presetMap[branding.presetIcon];
    if (emoji) {
      return <span className="text-xl leading-none select-none">{emoji}</span>;
    }

    return <Compass className="w-5 h-5" />;
  };

  const appName = branding?.appName || '旅割';
  const appSubtitle = branding?.appSubtitle || 'TABI-WARI';

  return (
    <header
      id="tabiki-header"
      className={`w-full border-b sticky top-0 z-30 transition-colors duration-200 shadow-xs ${
        isDark
          ? 'bg-[#23201D] border-[#38322B] text-[#EDE7DF]'
          : 'bg-[#FAF8F3]/95 backdrop-blur-md border-[#EBE4D8] text-[#2C2622]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Aesthetic Brand */}
          <div className="flex items-center gap-2">
            <button
              id="header-home-btn"
              onClick={onHomeClick}
              className="group text-left flex items-center gap-3 focus:outline-none"
              title="返回旅記首頁"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-2xs overflow-hidden ${
                  isDark
                    ? 'bg-[#2E2924] border border-[#433B33] text-[#D4A373]'
                    : 'bg-[#F2ECE1] border border-[#E3D8C8] text-[#8C6E54] group-hover:bg-[#EAE0D0]'
                }`}
              >
                {renderLogoIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mincho font-semibold tracking-wide">
                    {appName}
                  </span>
                  <span
                    className={`text-[11px] font-sans px-2 py-0.5 rounded-full font-medium tracking-wider ${
                      isDark
                        ? 'bg-[#352F28] text-[#D4A373] border border-[#483F34]'
                        : 'bg-[#EFE7DC] text-[#786857] border border-[#DFD3C3]'
                    }`}
                  >
                    {appSubtitle}
                  </span>
                </div>
                <p
                  className={`text-xs font-sans tracking-wide hidden sm:block ${
                    isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'
                  }`}
                >
                  旅行記帳 · 多人分帳與多幣換算
                </p>
              </div>
            </button>
          </div>

          {/* Quick Aggregate Stats for desktop */}
          {!isInsideTrip && (
            <div
              className={`hidden xl:flex items-center gap-4 text-xs px-3.5 py-1.5 rounded-xl border ${
                isDark
                  ? 'bg-[#2A2521] border-[#3D352D] text-[#B8AEA2]'
                  : 'bg-[#F5EFE6] border-[#E8DFC0] text-[#736A61]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>{totalTrips} 趟旅行</span>
              </div>
              <span className="opacity-40">·</span>
              <div className="flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>{totalExpensesCount} 筆記帳</span>
              </div>
              <span className="opacity-40">·</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>{totalMembers} 位旅伴</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Live Exchange Rate Board Button */}
            {onOpenLiveRates && (
              <button
                id="header-live-rates-btn"
                onClick={onOpenLiveRates}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-[#2A2521] border-[#3D352D] text-[#81B29A] hover:bg-[#352E28]'
                    : 'bg-[#FFFFFF] border-[#E3D8C8] text-[#3D7A64] hover:bg-[#F5EFE6]'
                }`}
                title="即時匯率行情看板與多幣快速換算"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#81B29A]" />
                <span className="hidden md:inline">即時匯率</span>
              </button>
            )}

            {/* Auto-save status indicator */}
            <div
              id="header-autosave-indicator"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono border transition-all ${
                saveStatus === 'saving'
                  ? isDark
                    ? 'bg-[#3A3228] text-[#D4A373] border-[#524434]'
                    : 'bg-[#F5EDE1] text-[#916738] border-[#E8D9C5]'
                  : isDark
                  ? 'bg-[#1D2B20] text-[#81B29A] border-[#2A3F30]'
                  : 'bg-[#EFF8F2] text-[#3B7A4E] border-[#CDE5D5]'
              }`}
              title={`自動儲存保護中 (LocalStorage + IndexedDB 雙庫儲存)${lastSavedTime ? ` · 最近儲存: ${lastSavedTime}` : ''}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saving' ? 'bg-[#D4A373] animate-ping' : 'bg-[#81B29A]'
                }`}
              />
              <span>{saveStatus === 'saving' ? '自動儲存中' : '已自動儲存'}</span>
            </div>

            {/* New Trip Button */}
            <button
              id="header-new-trip-btn"
              onClick={onNewTrip}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs ${
                isDark
                  ? 'bg-[#D4A373] hover:bg-[#C29060] text-[#1A1816]'
                  : 'bg-[#2D2825] hover:bg-[#433D39] text-[#FAF7F2]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新旅行記帳</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
