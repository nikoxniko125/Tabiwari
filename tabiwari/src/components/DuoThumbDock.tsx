import React, { useState } from 'react';
import { 
  Plus, BookOpen, Smartphone, TrendingUp, Share2, ChevronUp, Layers, X 
} from 'lucide-react';

interface DuoThumbDockProps {
  isDuoSplitMode: boolean;
  onToggleDuoMode: () => void;
  onAddExpense: () => void;
  onOpenSettlementShare: () => void;
  onOpenLiveRates?: () => void;
  isDark?: boolean;
}

export const DuoThumbDock: React.FC<DuoThumbDockProps> = ({
  isDuoSplitMode,
  onToggleDuoMode,
  onAddExpense,
  onOpenSettlementShare,
  onOpenLiveRates,
  isDark = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <aside 
      aria-label="iPhone Duo 側邊工具列"
      className="duo-right-dock flex flex-col items-end gap-2.5 select-none"
    >
      {/* 展開後的次級快捷功能選單 (iPhone Duo 右側集中選單哲學) */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 animate-fadeIn mb-1">
          {/* 標籤小提示 */}
          <div className="px-2.5 py-1 rounded-full bg-black/60 dark:bg-white/10 backdrop-blur-md text-[10px] text-white/90 font-mono tracking-wider shadow-sm flex items-center gap-1.5 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-pulse" />
            <span>iPhone Duo 側邊單手選單</span>
          </div>

          {/* 1. 置頂按鈕 */}
          <button
            id="duo-dock-scroll-top"
            onClick={handleScrollTop}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#23201D]/95 border-[#433B33] text-[#EDE7DF] hover:bg-[#2F2923]'
                : 'bg-white/95 border-[#E8E1D5] text-[#2C2622] hover:bg-[#FAF8F3]'
            }`}
            title="滑動至最頂端"
          >
            <span>置頂</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* 2. 切換 iPhone Duo 雙欄 / 外屏單欄模式 */}
          <button
            id="duo-dock-toggle-split"
            onClick={() => {
              onToggleDuoMode();
              setIsOpen(false);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
              isDuoSplitMode
                ? isDark
                  ? 'bg-[#3D3126] border-[#D4A373] text-[#D4A373]'
                  : 'bg-[#F7EFE5] border-[#8C6E54] text-[#8C6E54]'
                : isDark
                ? 'bg-[#23201D]/95 border-[#433B33] text-[#EDE7DF] hover:bg-[#2F2923]'
                : 'bg-white/95 border-[#E8E1D5] text-[#2C2622] hover:bg-[#FAF8F3]'
            }`}
            title="切換 iPhone Duo 7.6吋展開雙欄 / 5.4吋外屏單欄"
          >
            <span>{isDuoSplitMode ? '切換為 5.4" 外屏單欄' : '展開 7.6" Duo 雙欄'}</span>
            {isDuoSplitMode ? <Smartphone className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5 text-[#D4A373]" />}
          </button>

          {/* 3. 即時匯率看板按鈕 */}
          {onOpenLiveRates && (
            <button
              id="duo-dock-live-rates"
              onClick={() => {
                onOpenLiveRates();
                setIsOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-[#23201D]/95 border-[#433B33] text-[#81B29A] hover:bg-[#2F2923]'
                  : 'bg-white/95 border-[#E8E1D5] text-[#3D7A64] hover:bg-[#FAF8F3]'
              }`}
              title="即時匯率行情與多幣換算"
            >
              <span>即時匯率換算</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#81B29A]" />
            </button>
          )}

          {/* 4. 匯出分帳清單按鈕 */}
          <button
            id="duo-dock-share-settlement"
            onClick={() => {
              onOpenSettlementShare();
              setIsOpen(false);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#23201D]/95 border-[#433B33] text-[#D4A373] hover:bg-[#2F2923]'
                : 'bg-white/95 border-[#E8E1D5] text-[#8C6E54] hover:bg-[#FAF8F3]'
            }`}
            title="複製分帳清單至 WhatsApp"
          >
            <span>匯出結算清單</span>
            <Share2 className="w-3.5 h-3.5 text-[#D4A373]" />
          </button>
        </div>
      )}

      {/* 主要操作列：展開/收合開關 + ＋記一筆主按鈕 */}
      <div className="flex items-center gap-2">
        {/* 次選單開合開關 */}
        <button
          id="duo-dock-menu-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
            isOpen
              ? isDark
                ? 'bg-[#D4A373] text-[#1A1816] border-[#D4A373]'
                : 'bg-[#2C2622] text-[#FAF8F3] border-[#2C2622]'
              : isDark
              ? 'bg-[#23201D]/95 border-[#433B33] text-[#D4A373] hover:bg-[#2F2923]'
              : 'bg-white/95 border-[#E2D8C8] text-[#8C6E54] hover:bg-[#FAF8F3]'
          }`}
          title="iPhone Duo 側邊快捷選單"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        </button>

        {/* 快速記帳 Primary Action 大按鈕 (單手拇指最易按區域) */}
        <button
          id="duo-dock-quick-add-btn"
          onClick={onAddExpense}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060] shadow-[#D4A373]/20'
              : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39] shadow-black/20'
          }`}
          title="記錄新消費 (單手拇指速記)"
        >
          <Plus className="w-4 h-4" />
          <span>記一筆</span>
        </button>
      </div>
    </aside>
  );
};
