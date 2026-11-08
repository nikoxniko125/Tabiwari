import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, BookOpen, Smartphone, TrendingUp, Share2, ChevronUp, Layers, X } from 'lucide-react';

interface DuoThumbDockProps {
  isDuoSplitMode: boolean;
  onToggleDuoMode: () => void;
  onAddExpense: () => void;
  onOpenSettlementShare: () => void;
  onOpenLiveRates?: () => void;
  onBack?: () => void;
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

  const dock = (
    <aside aria-label="側邊快捷工具列" className="duo-right-dock select-none">
      {isOpen && (
        <div className={`duo-dock-menu flex flex-col items-end gap-2 animate-fadeIn p-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${
          isDark ? 'bg-[#191715]/95 border-[#433B33]' : 'bg-[#FAF8F3]/95 border-[#E8E1D5]'
        }`}>
          <div className="px-2.5 py-1 rounded-full bg-black/75 text-[10px] text-white/90 font-mono tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-pulse" />
            <span>快捷操作選單</span>
          </div>
          <button id="duo-dock-scroll-top" onClick={handleScrollTop} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${isDark ? 'bg-[#23201D] border-[#433B33] text-[#EDE7DF]' : 'bg-white border-[#E8E1D5] text-[#2C2622]'}`}>
            <span>返回頂部</span><ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button id="duo-dock-toggle-split" onClick={() => { onToggleDuoMode(); setIsOpen(false); }} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border ${isDark ? 'bg-[#23201D] border-[#433B33] text-[#EDE7DF]' : 'bg-white border-[#E8E1D5] text-[#2C2622]'}`}>
            <span>{isDuoSplitMode ? '切換為單欄模式' : '展開雙欄模式'}</span>
            {isDuoSplitMode ? <Smartphone className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5 text-[#D4A373]" />}
          </button>
          {onOpenLiveRates && (
            <button id="duo-dock-live-rates" onClick={() => { onOpenLiveRates(); setIsOpen(false); }} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${isDark ? 'bg-[#23201D] border-[#433B33] text-[#81B29A]' : 'bg-white border-[#E8E1D5] text-[#3D7A64]'}`}>
              <span>即時匯率換算</span><TrendingUp className="w-3.5 h-3.5" />
            </button>
          )}
          <button id="duo-dock-share-settlement" onClick={() => { onOpenSettlementShare(); setIsOpen(false); }} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${isDark ? 'bg-[#23201D] border-[#433B33] text-[#D4A373]' : 'bg-white border-[#E8E1D5] text-[#8C6E54]'}`}>
            <span>匯出結算清單</span><Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="duo-dock-primary-stack">
        <button
          id="duo-dock-menu-toggle-btn"
          onClick={() => setIsOpen((value) => !value)}
          className={`flex items-center shadow-lg backdrop-blur-md border transition-all active:scale-95 ${
            isOpen
              ? 'bg-[#D4A373] text-[#1A1816] border-[#D4A373]'
              : isDark
                ? 'bg-[#23201D]/95 border-[#433B33] text-[#D4A373]'
                : 'bg-white/95 border-[#E2D8C8] text-[#8C6E54]'
          }`}
          title="側邊快捷選單"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          <span>圖層</span>
        </button>
        <button
          id="duo-dock-quick-add-btn"
          onClick={onAddExpense}
          className="flex items-center bg-[#D4A373] text-[#1A1816] shadow-xl border border-[#D4A373] active:scale-95"
          title="記錄新消費"
        >
          <Plus className="w-5 h-5" />
          <span>記一筆</span>
        </button>
      </div>
    </aside>
  );

  return typeof document !== 'undefined' ? createPortal(dock, document.body) : null;
};
