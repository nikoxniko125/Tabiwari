import React, { useState } from 'react';
import { 
  Calendar, MapPin, Plus, Edit3, Trash2, CheckCircle2, Circle, 
  Sparkles, CheckSquare, Square, Users, Share2, ReceiptText,
  PieChart, Search, ArrowRightLeft, TrendingUp, BookOpen, Smartphone, Copy
} from 'lucide-react';
import { 
  Trip, ExpenseItem, MainExpenseCategory, Participant, PackingItem, TripMemo 
} from '../types';
import { TripExpenseSummary, formatMoney } from '../utils/settlementCalculator';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCurrencyInfo } from '../utils/expenseConstants';
import { getParticipantColor } from '../utils/participantUtils';

interface DuoSplitViewProps {
  trip: Trip;
  summary: TripExpenseSummary;
  filteredExpenses: ExpenseItem[];
  groupedExpensesByDate: Record<string, ExpenseItem[]>;
  categoryFilter: MainExpenseCategory | 'all';
  setCategoryFilter: (cat: MainExpenseCategory | 'all') => void;
  participantFilter: string;
  setParticipantFilter: (p: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  settledTransferIds: Record<string, boolean>;
  toggleSettledTransfer: (key: string) => void;
  onAddExpense: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onViewExpenseDetail: (expense: ExpenseItem) => void;
  onOpenSettlementShare: () => void;
  onOpenLiveRates?: () => void;
  onAddPackingItem: (item: Omit<PackingItem, 'id'>) => void;
  onTogglePackingItem: (itemId: string) => void;
  onDeletePackingItem: (itemId: string) => void;
  onAddMemo: () => void;
  onDeleteMemo: (memoId: string) => void;
  onToggleDuoMode: () => void;
  isDark?: boolean;
}

export const DuoSplitView: React.FC<DuoSplitViewProps> = ({
  trip,
  summary,
  filteredExpenses,
  groupedExpensesByDate,
  categoryFilter,
  setCategoryFilter,
  participantFilter,
  setParticipantFilter,
  searchQuery,
  setSearchQuery,
  settledTransferIds,
  toggleSettledTransfer,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onViewExpenseDetail,
  onOpenSettlementShare,
  onOpenLiveRates,
  onAddPackingItem,
  onTogglePackingItem,
  onDeletePackingItem,
  onAddMemo,
  onDeleteMemo,
  onToggleDuoMode,
  isDark = false,
}) => {
  const [rightPaneTab, setRightPaneTab] = useState<'expenses' | 'analytics'>('expenses');
  const [isCompanionsDrawerOpen, setIsCompanionsDrawerOpen] = useState(false);
  const [newPackingInput, setNewPackingInput] = useState('');

  const baseCurrency = trip.baseCurrency || 'HKD';
  const baseCurrInfo = getCurrencyInfo(baseCurrency);
  const participants = trip.participants || [];
  const expenses = trip.expenses || [];

  const handleAddPacking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingInput.trim()) return;
    onAddPackingItem({
      name: newPackingInput.trim(),
      packed: false,
      category: 'personal',
    });
    setNewPackingInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-24 animate-fadeIn">
      {/* 1. 雙欄多工狀態橫條 */}
      <div
        className={`p-3.5 mb-5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors ${
          isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#81B29A]/15 text-[#3D7A64] dark:text-[#81B29A]">
            <BookOpen className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold">雙欄多工視圖</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#81B29A]/15 text-[#3D7A64] dark:text-[#81B29A] font-semibold border border-[#81B29A]/30">
                並排模式
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
              左欄：旅伴分帳清算與備忘 · 右欄：消費明細流水與分類
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 右欄視圖切換器 (流水明細 vs 分析圖表) */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#2A2521] border-[#433B33]' : 'bg-[#FAF8F3] border-[#DDD5C7]'
            }`}
          >
            <button
              id="duo-view-switch-expenses"
              onClick={() => setRightPaneTab('expenses')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                rightPaneTab === 'expenses'
                  ? isDark
                    ? 'bg-[#D4A373] text-[#1A1816]'
                    : 'bg-[#2C2622] text-[#FAF8F3]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              消費明細 ({expenses.length})
            </button>
            <button
              id="duo-view-switch-analytics"
              onClick={() => setRightPaneTab('analytics')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                rightPaneTab === 'analytics'
                  ? isDark
                    ? 'bg-[#D4A373] text-[#1A1816]'
                    : 'bg-[#2C2622] text-[#FAF8F3]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              支出分析圖表
            </button>
          </div>

          {/* 切換為單欄按鈕 */}
          <button
            id="duo-switch-to-single-btn"
            onClick={onToggleDuoMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isDark
                ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] hover:bg-[#352F28]'
                : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622] hover:bg-[#F2ECE1]'
            }`}
            title="切換回單欄模式"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">切換為單欄模式</span>
          </button>
        </div>
      </div>

      {/* 2. 雙欄並排核心容器 (Left: 5 cols, Right: 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================
            LEFT COLUMN (lg:col-span-5): 旅伴分帳清算 + 轉帳清算 + 備忘
            ======================================================== */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          
          {/* 旅伴成員收支平衡卡片 */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-colors space-y-4 ${
              isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 font-mincho">
                  <Sparkles className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                  <span>旅伴成員收支平衡總覽</span>
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  每人代付 vs 應攤消費額，自動結算淨差額
                </p>
              </div>

              <button
                onClick={onOpenSettlementShare}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-[#433B33] text-[#D4A373] hover:bg-[#2A2521]'
                    : 'border-[#DDD5C7] text-[#8C6E54] hover:bg-[#FAF8F3]'
                }`}
                title="複製文字至 WhatsApp"
              >
                <Copy className="w-3 h-3" />
                <span>複製結算</span>
              </button>
            </div>

            {/* 成員清單 */}
            <div className="space-y-2.5">
              {summary.participantBalances.map((b, idx) => {
                const isPositive = b.netBalance > 0.05;
                const isNegative = b.netBalance < -0.05;

                return (
                  <div
                    key={b.participant.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-[#FAF8F3] border-[#EBE4D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: getParticipantColor(b.participant, idx) }}
                        >
                          {(b.participant?.name || '旅').charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{b.participant?.name || '成員'}</p>
                          {b.participant?.isCurrentUser && (
                            <span className="text-[10px] opacity-60">本人</span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          isPositive
                            ? isDark ? 'bg-[#1E3224] text-[#81B29A]' : 'bg-[#EFF8F2] text-[#3B7A4E]'
                            : isNegative
                            ? isDark ? 'bg-[#3A2420] text-[#E07A5F]' : 'bg-[#FDF2F0] text-[#C55353]'
                            : isDark ? 'bg-[#2E2924] text-[#B5ABA0]' : 'bg-[#F2ECE1] text-[#736A61]'
                        }`}
                      >
                        {isPositive ? '應收回' : isNegative ? '應補付' : '已平帳'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-black/5 dark:border-white/5 text-[11px]">
                      <div>
                        <span className="opacity-60 block">已墊付</span>
                        <span className="font-mono font-medium">
                          {baseCurrInfo.symbol}{formatMoney(b.totalPaid, baseCurrency)}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-60 block">應分攤</span>
                        <span className="font-mono font-medium">
                          {baseCurrInfo.symbol}{formatMoney(b.totalShare, baseCurrency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="opacity-60 block">差額</span>
                        <span className={`font-mono font-bold ${
                          isPositive ? 'text-[#3B7A4E] dark:text-[#81B29A]' : isNegative ? 'text-[#C55353] dark:text-[#E07A5F]' : ''
                        }`}>
                          {isPositive ? '+' : ''}{baseCurrInfo.symbol}{formatMoney(b.netBalance, baseCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 建議清算轉帳路徑 (最少轉帳次數) */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-colors space-y-3 ${
              isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 font-mincho">
                <ArrowRightLeft className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>建議平帳轉帳路徑</span>
              </h3>
              <span className="text-[11px] opacity-60">
                點擊標記已付清
              </span>
            </div>

            {summary.settlementTransfers.length === 0 ? (
              <div className="p-6 text-center bg-[#FAF8F3] dark:bg-[#1D1B18] rounded-2xl border border-dashed border-[#E5DDD0] dark:border-[#38312A]">
                <p className="text-sm font-mincho font-semibold mb-1">🎉 帳目已完全平衡！</p>
                <p className="text-[11px] opacity-70">
                  目前所有參與者墊付與應攤金額已抵銷，無需額外轉帳。
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {summary.settlementTransfers.map((t, idx) => {
                  const transferKey = `${t.fromParticipantId}->${t.toParticipantId}-${idx}`;
                  const isSettled = !!settledTransferIds[transferKey];

                  return (
                    <div
                      key={transferKey}
                      onClick={() => toggleSettledTransfer(transferKey)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSettled
                          ? isDark
                            ? 'bg-[#1E2E23] border-[#2B4633] opacity-60'
                            : 'bg-[#EFF8F2] border-[#CDE5D5] opacity-60'
                          : isDark
                          ? 'bg-[#2A2521] border-[#38312A] hover:border-[#4E443A]'
                          : 'bg-[#FAF8F3] border-[#EBE4D8] hover:border-[#D5C9B8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">
                          {isSettled ? (
                            <CheckCircle2 className="w-4 h-4 text-[#3B7A4E] dark:text-[#81B29A]" />
                          ) : (
                            <Circle className="w-4 h-4 opacity-40" />
                          )}
                        </div>
                        <div className="text-xs truncate">
                          <span className="font-semibold">{t.fromParticipantName}</span>
                          <span className="opacity-60 mx-1">➜</span>
                          <span className="font-semibold text-[#8C6E54] dark:text-[#D4A373]">
                            {t.toParticipantName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm font-bold font-mono shrink-0 ml-2 ${
                          isSettled ? 'line-through opacity-60' : 'text-[#8C6E54] dark:text-[#D4A373]'
                        }`}
                      >
                        {baseCurrInfo.symbol} {formatMoney(t.amount, baseCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 折疊式行李清單與行程備忘抽屜 */}
          <div
            className={`p-4 rounded-3xl border transition-colors ${
              isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <button
              onClick={() => setIsCompanionsDrawerOpen(!isCompanionsDrawerOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold py-1 focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>行李打包與行程備忘 ({trip.packingItems?.length || 0} 項裝備)</span>
              </span>
              <span className="text-[11px] opacity-60">
                {isCompanionsDrawerOpen ? '收合 ▲' : '展開查看 ▼'}
              </span>
            </button>

            {isCompanionsDrawerOpen && (
              <div className="mt-4 pt-4 border-t border-dashed border-[#EAE3D8] dark:border-[#38322B] animate-fadeIn space-y-4">
                {/* Packing input */}
                <form onSubmit={handleAddPacking} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="新增物品 (例如：護照、Suica、轉接頭)..."
                    value={newPackingInput}
                    onChange={(e) => setNewPackingInput(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                      isDark
                        ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                        : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
                      isDark
                        ? 'bg-[#D4A373] text-[#1A1816]'
                        : 'bg-[#2C2622] text-[#FAF8F3]'
                    }`}
                  >
                    加入
                  </button>
                </form>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {(trip.packingItems || []).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onTogglePackingItem(item.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        item.packed
                          ? isDark
                            ? 'bg-[#1E2E23] border-[#2B4633] opacity-60'
                            : 'bg-[#EFF8F2] border-[#CDE5D5] opacity-60'
                          : isDark
                          ? 'bg-[#2A2521] border-[#38312A]'
                          : 'bg-[#FAF8F3] border-[#EBE4D8]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.packed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#3B7A4E] dark:text-[#81B29A] shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${item.packed ? 'line-through' : ''}`}>
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePackingItem(item.id);
                        }}
                        className="opacity-40 hover:opacity-100 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Memo notes preview */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="opacity-70">備忘筆記 ({trip.memos?.length || 0} 則)</span>
                  <button
                    onClick={onAddMemo}
                    className="text-[11px] text-[#8C6E54] dark:text-[#D4A373] hover:underline"
                  >
                    + 新增備忘
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN (lg:col-span-7): 消費明細流水帳 OR 支出圖表
            ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {rightPaneTab === 'expenses' ? (
            /* 1. 消費明細時序區 */
            <div className="space-y-5">
              {/* Filter & Search Bar */}
              <div
                className={`p-4 rounded-3xl border transition-colors space-y-3 ${
                  isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                }`}
              >
                {/* Category pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                      categoryFilter === 'all'
                        ? isDark
                          ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                          : 'bg-[#2C2622] text-[#FAF8F3] font-medium'
                        : isDark
                        ? 'bg-[#2E2924] text-[#B5ABA0] hover:bg-[#352F28]'
                        : 'bg-[#F2ECE1] text-[#5C5248] hover:bg-[#EAE0D0]'
                    }`}
                  >
                    全部類別
                  </button>

                  {(Object.keys(EXPENSE_CATEGORIES) as MainExpenseCategory[]).map((catKey) => {
                    const meta = EXPENSE_CATEGORIES[catKey];
                    const isSelected = categoryFilter === catKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setCategoryFilter(catKey)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                              : 'bg-[#2C2622] text-[#FAF8F3] font-medium'
                            : isDark
                            ? 'bg-[#2E2924] text-[#B5ABA0] hover:bg-[#352F28]'
                            : 'bg-[#F2ECE1] text-[#5C5248] hover:bg-[#EAE0D0]'
                        }`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Participant selector & Search Input */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className={`text-xs whitespace-nowrap ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                      篩選旅伴：
                    </span>
                    <select
                      value={participantFilter}
                      onChange={(e) => setParticipantFilter(e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                          : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                      }`}
                    >
                      <option value="all">所有旅伴支出</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isCurrentUser ? '(本人)' : ''} 的相關支出
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-50" />
                    <input
                      type="text"
                      placeholder="搜尋項目、細項、地點..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                          : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-xs opacity-50 hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expenses List Grouped by Date */}
              {Object.keys(groupedExpensesByDate).length === 0 ? (
                <div
                  className={`p-10 text-center rounded-3xl border ${
                    isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#F4EFE6] dark:bg-[#2F2923] text-2xl">
                    🍵
                  </div>
                  <h3 className="text-sm font-mincho font-semibold mb-1">
                    尚無符合條件的消費記帳
                  </h3>
                  <p className={`text-xs mb-3 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    點擊右側懸浮按鈕或下方按鈕記錄支出！
                  </p>
                  <button
                    onClick={onAddExpense}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                      isDark
                        ? 'bg-[#D4A373] text-[#1A1816]'
                        : 'bg-[#2C2622] text-[#FAF8F3]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>記錄新消費</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(groupedExpensesByDate).map(([dateStr, items]) => {
                    const dayTotal = items.reduce((acc, it) => acc + it.convertedAmount, 0);

                    return (
                      <div key={dateStr} className="space-y-2.5">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                              {dateStr}
                            </span>
                            <span className="text-xs opacity-50">({items.length} 筆)</span>
                          </div>
                          <div className="text-xs font-mono font-medium opacity-80">
                            當日小計：{baseCurrInfo.symbol} {formatMoney(dayTotal, baseCurrency)} {baseCurrency}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.map((item) => {
                            const catMeta = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
                            const payer = participants.find((p) => p.id === item.payerId) || {
                              id: item.payerId,
                              name: '未知成員',
                              avatarColor: '#8C6E54',
                            };
                            const currMeta = getCurrencyInfo(item.currency);
                            const paymentMeta = PAYMENT_METHODS[item.paymentMethod] || PAYMENT_METHODS.credit_card;

                            return (
                              <div
                                key={item.id}
                                onClick={() => onViewExpenseDetail(item)}
                                className={`group p-3.5 rounded-2xl border cursor-pointer transition-all hover:shadow-md relative flex flex-col justify-between ${
                                  isDark
                                    ? 'bg-[#23201D] border-[#38312A] hover:border-[#4E443A]'
                                    : 'bg-[#FFFFFF] border-[#EBE4D8] hover:border-[#D5C9B8]'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2.5 mb-2">
                                    <div className="flex items-start gap-2 min-w-0">
                                      <span className="text-xl p-1.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2C2622] shrink-0">
                                        {catMeta.icon}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1 mb-1">
                                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#FAF5EE] dark:bg-[#322A22] text-[#8C6E54] dark:text-[#D4A373]">
                                            {item.subcategory || catMeta.name}
                                          </span>
                                          <span className="text-[10px] opacity-60 flex items-center gap-0.5">
                                            <span>{paymentMeta.icon}</span>
                                            <span>{paymentMeta.label}</span>
                                          </span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-semibold truncate group-hover:text-[#8C6E54] dark:group-hover:text-[#D4A373] transition-colors">
                                          {item.title}
                                        </h4>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <p className="text-xs sm:text-sm font-bold font-mono">
                                        {currMeta.symbol} {item.amount.toLocaleString()}
                                        <span className="text-[10px] font-normal ml-1 opacity-70">
                                          {item.currency}
                                        </span>
                                      </p>
                                      {item.currency !== baseCurrency && (
                                        <p className="text-[11px] font-mono opacity-60 text-[#8C6E54] dark:text-[#D4A373]">
                                          ≈ {baseCurrInfo.symbol} {formatMoney(item.convertedAmount, baseCurrency)}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {(item.location || item.notes) && (
                                    <div className="flex items-center gap-2 text-[10px] opacity-70 mb-2">
                                      {item.location && (
                                        <span className="flex items-center gap-0.5 truncate">
                                          <MapPin className="w-2.5 h-2.5 text-[#8C6E54] dark:text-[#D4A373]" />
                                          <span>{item.location}</span>
                                        </span>
                                      )}
                                      {item.time && <span>{item.time}</span>}
                                    </div>
                                  )}
                                </div>

                                <div
                                  className={`pt-2 border-t flex items-center justify-between text-xs mt-1 ${
                                    isDark ? 'border-[#332D27]' : 'border-[#F2ECE1]'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-medium"
                                      style={{ backgroundColor: getParticipantColor(payer) }}
                                    >
                                      {(payer?.name || '旅').charAt(0)}
                                    </div>
                                    <span className="text-[11px] opacity-75 truncate">
                                      {payer?.name || '未知成員'} 付款
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF5EE] dark:bg-[#2C2622] text-[#8C6E54] dark:text-[#D4A373]">
                                      {item.splitType === 'equal'
                                        ? `${item.involvedParticipantIds?.length || participants.length}人均分`
                                        : item.splitType === 'custom'
                                        ? '自訂分攤'
                                        : '個人支出'}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditExpense(item);
                                      }}
                                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-40 hover:opacity-100"
                                      title="編輯"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 2. 支出分析圖表區 */
            <div
              className={`p-6 rounded-3xl border space-y-5 ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mincho font-semibold flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                    <span>各類別支出細分圖表</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    總計支出：{baseCurrInfo.symbol} {formatMoney(summary.totalExpense, baseCurrency)} {baseCurrency}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {(Object.keys(EXPENSE_CATEGORIES) as MainExpenseCategory[]).map((catKey) => {
                  const meta = EXPENSE_CATEGORIES[catKey];
                  const spent = summary.categoryTotals[catKey] || 0;
                  const percentage = summary.totalExpense > 0 
                    ? Math.round((spent / summary.totalExpense) * 100) 
                    : 0;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span className="font-medium">{meta.name}</span>
                        </div>
                        <div className="font-mono">
                          <span className="font-semibold">
                            {baseCurrInfo.symbol} {formatMoney(spent, baseCurrency)}
                          </span>
                          <span className="opacity-60 ml-2 text-[11px]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isDark ? '#D4A373' : '#8C6E54',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
