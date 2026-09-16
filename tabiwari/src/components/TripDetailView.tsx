import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Plus, Edit3, Trash2, CheckCircle2, Circle, 
  DollarSign, Sparkles, CheckSquare, Square, Users, Share2, ReceiptText,
  PieChart, Filter, Search, ArrowRightLeft, CreditCard, ChevronRight,
  Info, ArrowUpRight, ArrowDownLeft, Check, Copy, Tag, Eye, TrendingUp
} from 'lucide-react';
import { 
  Trip, ExpenseItem, MainExpenseCategory, Participant, PackingItem, TripMemo 
} from '../types';
import { formatDateRange, calculateDaysBetween, loadActiveTab, saveActiveTab } from '../utils/storage';
import { calculateTripExpenseSummary, formatMoney } from '../utils/settlementCalculator';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCurrencyInfo } from '../utils/expenseConstants';
import { getParticipantColor } from '../utils/participantUtils';

interface TripDetailViewProps {
  trip: Trip;
  onBack: () => void;
  onEditTrip: () => void;
  onDeleteTrip: () => void;
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
  isDark?: boolean;
}

type TabType = 'expenses' | 'settlement' | 'analytics' | 'companions';

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  trip,
  onBack,
  onEditTrip,
  onDeleteTrip,
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
  isDark = false,
}) => {
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const saved = loadActiveTab(trip.id);
    if (saved === 'expenses' || saved === 'settlement' || saved === 'analytics' || saved === 'companions') {
      return saved;
    }
    return 'expenses';
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    saveActiveTab(trip.id, tab);
  };

  // Expense filters
  const [categoryFilter, setCategoryFilter] = useState<MainExpenseCategory | 'all'>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Packing list quick add
  const [newPackingInput, setNewPackingInput] = useState('');

  // Settlement transfer checklist state (stored in component local state)
  const [settledTransferIds, setSettledTransferIds] = useState<Record<string, boolean>>({});

  const days = calculateDaysBetween(trip.startDate, trip.endDate);
  const baseCurrency = trip.baseCurrency || 'HKD';
  const baseCurrInfo = getCurrencyInfo(baseCurrency);
  const participants = trip.participants || [];
  const expenses = trip.expenses || [];

  // Calculate overall summary and debt transfers
  const summary = useMemo(() => calculateTripExpenseSummary(trip), [trip]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      // Participant filter (payer OR involved)
      if (participantFilter !== 'all') {
        const isPayer = item.payerId === participantFilter;
        const isInvolved = item.involvedParticipantIds?.includes(participantFilter) || 
          (item.splitDetails && item.splitDetails[participantFilter] > 0);
        if (!isPayer && !isInvolved) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (item.title || '').toLowerCase().includes(query);
        const matchesSubcat = (item.subcategory || '').toLowerCase().includes(query);
        const matchesLocation = (item.location || '').toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubcat && !matchesLocation && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, categoryFilter, participantFilter, searchQuery]);

  // Group filtered expenses by date
  const groupedExpensesByDate = useMemo(() => {
    const groups: Record<string, ExpenseItem[]> = {};
    // Sort descending by date, then time
    const sorted = [...filteredExpenses].sort((a, b) => {
      const cmpDate = (b.date || '').localeCompare(a.date || '');
      if (cmpDate !== 0) return cmpDate;
      return (b.time || '').localeCompare(a.time || '');
    });

    sorted.forEach((item) => {
      const d = item.date || '未分類日期';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return groups;
  }, [filteredExpenses]);

  // Toggle settled transfer
  const toggleSettledTransfer = (transferKey: string) => {
    setSettledTransferIds((prev) => ({
      ...prev,
      [transferKey]: !prev[transferKey],
    }));
  };

  // Add packing item handler
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
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#191715] text-[#EDE7DF]' : 'bg-[#FAF8F3] text-[#2C2622]'
    }`}>
      {/* 1. Hero Cover Header */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-[#2C2622]">
        <img
          src={trip.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        {/* Top Floating Navigation */}
        <div className="absolute top-4 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          <button
            id="trip-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回旅記列表</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenLiveRates && (
              <button
                id="trip-live-rates-btn"
                onClick={onOpenLiveRates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 transition-colors"
                title="即時匯率看板與換算"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#81B29A]" />
                <span className="hidden sm:inline">即時匯率</span>
              </button>
            )}

            <button
              id="trip-share-btn"
              onClick={onOpenSettlementShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 transition-colors"
              title="匯出分帳與轉帳清單"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>匯出結算清單</span>
            </button>

            <button
              id="trip-edit-header-btn"
              onClick={onEditTrip}
              className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-colors"
              title="編輯旅程與成員"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id="trip-delete-header-btn"
              onClick={() => {
                if (confirm(`確定要刪除「${trip.title}」及其所有記帳資料嗎？`)) {
                  onDeleteTrip();
                }
              }}
              className="p-1.5 rounded-xl bg-black/40 hover:bg-[#C55353]/80 backdrop-blur-md text-white border border-white/10 transition-colors"
              title="刪除旅程"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Hero Info */}
        <div className="absolute bottom-6 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-md border border-white/20">
              <MapPin className="w-3 h-3 text-[#D4A373]" />
              <span>{trip.destination}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-md border border-white/20">
              <Calendar className="w-3 h-3" />
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#D4A373] text-[#1A1816]">
              基準幣：{baseCurrInfo.flag} {baseCurrInfo.code}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mincho font-bold leading-tight mb-2">
            {trip.title}
          </h1>
          {trip.subtitle && (
            <p className="text-xs sm:text-sm text-white/80 font-sans max-w-3xl line-clamp-2">
              {trip.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metrics Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg transition-colors ${
            isDark
              ? 'bg-[#23201D] border-[#3C352E] text-[#EDE7DF]'
              : 'bg-[#FFFFFF] border-[#E8E1D5] text-[#2C2622]'
          }`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEAE1] dark:divide-[#38312A]">
            
            {/* Total Expense */}
            <div className="pt-2 lg:pt-0 lg:px-3">
              <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'} mb-1 flex items-center gap-1`}>
                <ReceiptText className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>旅程總支出 ({baseCurrency})</span>
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#8C6E54] dark:text-[#D4A373]">
                {formatMoney(summary.totalExpense, baseCurrency)}
              </p>
              {trip.budget && (
                <p className="text-[11px] opacity-60 mt-0.5">
                  預算 {formatMoney(trip.budget, baseCurrency)} ({Math.round((summary.totalExpense / trip.budget) * 100)}%)
                </p>
              )}
            </div>

            {/* Per-person average */}
            <div className="pt-2 lg:pt-0 lg:px-3">
              <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'} mb-1`}>
                人均分攤支出
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono">
                {formatMoney(summary.averagePerPerson, baseCurrency)}
              </p>
              <p className="text-[11px] opacity-60 mt-0.5">
                {participants.length} 位成員均攤參考
              </p>
            </div>

            {/* Transactions & Records */}
            <div className="pt-2 lg:pt-0 lg:px-3">
              <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'} mb-1`}>
                記帳筆數
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono">
                {expenses.length} <span className="text-sm font-normal">筆消費</span>
              </p>
              <p className="text-[11px] opacity-60 mt-0.5">
                涵蓋 {days} 天旅程細項
              </p>
            </div>

            {/* Companions & Add Expense CTA */}
            <div className="pt-2 lg:pt-0 lg:px-3 flex flex-col justify-between">
              <div>
                <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'} mb-1.5`}>
                  同行旅伴 ({participants.length}人)
                </p>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-[#23201D] flex items-center justify-center text-white text-[10px] font-medium"
                      style={{ backgroundColor: p.avatarColor }}
                      title={p.name}
                    >
                      {p.name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="trip-add-expense-cta"
                onClick={onAddExpense}
                className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                    : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>記錄新支出</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div
          className={`flex items-center gap-1.5 border-b pb-px ${
            isDark ? 'border-[#38312A]' : 'border-[#EBE4D8]'
          }`}
        >
          <button
            id="tab-btn-expenses"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'expenses'
                ? isDark
                  ? 'bg-[#23201D] text-[#D4A373] border-t-2 border-x border-t-[#D4A373] border-[#3C352E]'
                  : 'bg-[#FAF8F3] text-[#2C2622] border-t-2 border-x border-t-[#8C6E54] border-[#E8E1D5] font-semibold'
                : 'text-[#7D756C] hover:text-[#2C2622] dark:hover:text-[#EDE7DF]'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>消費明細 ({expenses.length})</span>
          </button>

          <button
            id="tab-btn-settlement"
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'settlement'
                ? isDark
                  ? 'bg-[#23201D] text-[#D4A373] border-t-2 border-x border-t-[#D4A373] border-[#3C352E]'
                  : 'bg-[#FAF8F3] text-[#2C2622] border-t-2 border-x border-t-[#8C6E54] border-[#E8E1D5] font-semibold'
                : 'text-[#7D756C] hover:text-[#2C2622] dark:hover:text-[#EDE7DF]'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>分帳結算 ({summary.settlementTransfers.length} 筆清算)</span>
          </button>

          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? isDark
                  ? 'bg-[#23201D] text-[#D4A373] border-t-2 border-x border-t-[#D4A373] border-[#3C352E]'
                  : 'bg-[#FAF8F3] text-[#2C2622] border-t-2 border-x border-t-[#8C6E54] border-[#E8E1D5] font-semibold'
                : 'text-[#7D756C] hover:text-[#2C2622] dark:hover:text-[#EDE7DF]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>支出分析與類別</span>
          </button>

          <button
            id="tab-btn-companions"
            onClick={() => setActiveTab('companions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'companions'
                ? isDark
                  ? 'bg-[#23201D] text-[#D4A373] border-t-2 border-x border-t-[#D4A373] border-[#3C352E]'
                  : 'bg-[#FAF8F3] text-[#2C2622] border-t-2 border-x border-t-[#8C6E54] border-[#E8E1D5] font-semibold'
                : 'text-[#7D756C] hover:text-[#2C2622] dark:hover:text-[#EDE7DF]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>旅伴與行李備忘</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* TAB 1: 消費明細 (Expense Ledger) */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div
              className={`p-4 rounded-2xl border transition-colors space-y-3 ${
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

              {/* Participant filter & Search Input */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className={`text-xs whitespace-nowrap ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    篩選旅伴：
                  </span>
                  <select
                    id="expense-filter-participant-select"
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

                {/* Search input */}
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

            {/* Expenses List (Grouped by Date) */}
            {Object.keys(groupedExpensesByDate).length === 0 ? (
              <div
                className={`p-12 text-center rounded-3xl border ${
                  isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-[#F4EFE6] dark:bg-[#2F2923] text-2xl">
                  🍵
                </div>
                <h3 className="text-base font-mincho font-semibold mb-1">
                  尚無符合條件的消費記帳
                </h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  點擊下方按鈕開始記錄你的第一筆住宿、餐飲或交通支出！
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
              <div className="space-y-6">
                {Object.entries(groupedExpensesByDate).map(([dateStr, items]) => {
                  const dayTotal = items.reduce((acc, it) => acc + it.convertedAmount, 0);

                  return (
                    <div key={dateStr} className="space-y-3">
                      {/* Date header & subtotal */}
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

                      {/* Items grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                              id={`expense-card-${item.id}`}
                              onClick={() => onViewExpenseDetail(item)}
                              className={`group p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md relative flex flex-col justify-between ${
                                isDark
                                  ? 'bg-[#23201D] border-[#38312A] hover:border-[#4E443A]'
                                  : 'bg-[#FFFFFF] border-[#EBE4D8] hover:border-[#D5C9B8]'
                              }`}
                            >
                              <div>
                                {/* Card top: Category icon & title & amount */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span className="text-2xl p-1.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2C2622] shrink-0">
                                      {catMeta.icon}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#FAF5EE] dark:bg-[#322A22] text-[#8C6E54] dark:text-[#D4A373]">
                                          {item.subcategory || catMeta.name}
                                        </span>
                                        <span className="text-[10px] opacity-60 flex items-center gap-0.5">
                                          <span>{paymentMeta.icon}</span>
                                          <span>{paymentMeta.label}</span>
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-semibold truncate group-hover:text-[#8C6E54] dark:group-hover:text-[#D4A373] transition-colors">
                                        {item.title}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* Amount */}
                                  <div className="text-right shrink-0">
                                    <p className="text-sm sm:text-base font-bold font-mono">
                                      {currMeta.symbol} {item.amount.toLocaleString()}
                                      <span className="text-[11px] font-normal ml-1 opacity-70">
                                        {item.currency}
                                      </span>
                                    </p>
                                    {item.currency !== baseCurrency && (
                                      <p className="text-xs font-mono opacity-60 text-[#8C6E54] dark:text-[#D4A373]">
                                        ≈ {baseCurrInfo.symbol} {formatMoney(item.convertedAmount, baseCurrency)} {baseCurrency}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Location or notes if any */}
                                {(item.location || item.notes) && (
                                  <div className="flex items-center gap-3 text-[11px] opacity-70 mb-3">
                                    {item.location && (
                                      <span className="flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-[#8C6E54] dark:text-[#D4A373]" />
                                        <span>{item.location}</span>
                                      </span>
                                    )}
                                    {item.time && <span>{item.time}</span>}
                                  </div>
                                )}
                              </div>

                              {/* Card footer: Who paid & Split summary */}
                              <div
                                className={`pt-2.5 border-t flex items-center justify-between text-xs mt-2 ${
                                  isDark ? 'border-[#332D27]' : 'border-[#F2ECE1]'
                                }`}
                              >
                                {/* Payer info */}
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                                    style={{ backgroundColor: getParticipantColor(payer) }}
                                  >
                                    {(payer?.name || '旅').charAt(0)}
                                  </div>
                                  <span className="text-xs opacity-75 truncate">
                                    {payer?.name || '未知成員'} 付款
                                  </span>
                                </div>

                                {/* Split info pill */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#FAF5EE] dark:bg-[#2C2622] text-[#8C6E54] dark:text-[#D4A373]">
                                    {item.splitType === 'equal'
                                      ? `${item.involvedParticipantIds?.length || participants.length}人均分`
                                      : item.splitType === 'custom'
                                      ? '自訂金額分攤'
                                      : '個人專屬支出'}
                                  </span>

                                  {/* Quick edit / delete trigger */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditExpense(item);
                                    }}
                                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 opacity-40 hover:opacity-100"
                                    title="編輯此筆"
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
        )}

        {/* TAB 2: 分帳結算 (Split & Settlement) */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            
            {/* Intro banner */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FAF8F3] border-[#E8E1D5]'
              }`}
            >
              <div>
                <h3 className="text-sm font-mincho font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                  <span>各人支出統計與分帳結算</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  系統自動計算「邊個負責俾咗幾多錢」與「邊個用咗幾多錢」，並提供最少轉帳次數的清算方案。
                </p>
              </div>

              <button
                onClick={onOpenSettlementShare}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 shadow-xs ${
                  isDark
                    ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                    : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>複製結算清單</span>
              </button>
            </div>

            {/* 1. Participant Balance Cards */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1">
                旅伴成員收支平衡總覽 (各人代付 vs 應攤)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {summary.participantBalances.map((b, idx) => {
                  const isPositive = b.netBalance > 0.05;
                  const isNegative = b.netBalance < -0.05;

                  return (
                    <div
                      key={b.participant.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#23201D] border-[#38312A]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                      }`}
                    >
                      {/* Avatar and name */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
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

                        {/* Net status badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                            isPositive
                              ? isDark
                                ? 'bg-[#1E3224] text-[#81B29A]'
                                : 'bg-[#EFF8F2] text-[#3B7A4E]'
                              : isNegative
                              ? isDark
                                ? 'bg-[#3A2420] text-[#E07A5F]'
                                : 'bg-[#FDF2F0] text-[#C55353]'
                              : isDark
                              ? 'bg-[#2E2924] text-[#B5ABA0]'
                              : 'bg-[#F2ECE1] text-[#736A61]'
                          }`}
                        >
                          {isPositive && '應收回'}
                          {isNegative && '應補付'}
                          {!isPositive && !isNegative && '已平帳'}
                        </span>
                      </div>

                      {/* Numbers */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between opacity-70">
                          <span>已先墊付總額：</span>
                          <span className="font-mono font-medium">
                            {baseCurrInfo.symbol} {formatMoney(b.totalPaid, baseCurrency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between opacity-70">
                          <span>應分攤消費額：</span>
                          <span className="font-mono font-medium">
                            {baseCurrInfo.symbol} {formatMoney(b.totalShare, baseCurrency)}
                          </span>
                        </div>

                        {/* Net Difference */}
                        <div
                          className={`pt-2 border-t flex items-center justify-between font-semibold text-sm ${
                            isDark ? 'border-[#332D27]' : 'border-[#F2ECE1]'
                          } ${
                            isPositive
                              ? isDark ? 'text-[#81B29A]' : 'text-[#3B7A4E]'
                              : isNegative
                              ? isDark ? 'text-[#E07A5F]' : 'text-[#C55353]'
                              : ''
                          }`}
                        >
                          <span>淨差額：</span>
                          <span className="font-mono">
                            {isPositive ? '+' : ''}
                            {baseCurrInfo.symbol} {formatMoney(b.netBalance, baseCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Debt Transfers (Smart Settlement Transfers) */}
            <div
              className={`p-5 rounded-3xl border ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mincho font-semibold flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                    <span>建議清算轉帳方案 (最少交易次數)</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    每人只需依照下列指示轉帳一次即可完全平帳，點擊可標記已付款：
                  </p>
                </div>
              </div>

              {summary.settlementTransfers.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF8F3] dark:bg-[#1D1B18] rounded-2xl border border-dashed border-[#E5DDD0] dark:border-[#38312A]">
                  <p className="text-base font-mincho font-semibold mb-1">🎉 帳目已完全平衡！</p>
                  <p className="text-xs opacity-70">
                    目前所有參與者的付款與應攤金額剛好抵銷，無需額外進行任何清算轉帳。
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {summary.settlementTransfers.map((t, idx) => {
                    const transferKey = `${t.fromParticipantId}->${t.toParticipantId}-${idx}`;
                    const isSettled = !!settledTransferIds[transferKey];

                    return (
                      <div
                        key={transferKey}
                        onClick={() => toggleSettledTransfer(transferKey)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSettled
                            ? isDark
                              ? 'bg-[#1E2E23] border-[#2B4633] opacity-60'
                              : 'bg-[#EFF8F2] border-[#CDE5D5] opacity-60'
                            : isDark
                            ? 'bg-[#2A2521] border-[#38312A] hover:border-[#4E443A]'
                            : 'bg-[#FAF8F3] border-[#EBE4D8] hover:border-[#D5C9B8]'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          {/* Checkbox */}
                          <div className="shrink-0">
                            {isSettled ? (
                              <CheckCircle2 className="w-5 h-5 text-[#3B7A4E] dark:text-[#81B29A]" />
                            ) : (
                              <Circle className="w-5 h-5 opacity-40" />
                            )}
                          </div>

                          {/* From & To Names */}
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="font-semibold">{t.fromParticipantName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 opacity-70">
                              應轉帳給
                            </span>
                            <span className="font-semibold text-[#8C6E54] dark:text-[#D4A373]">
                              {t.toParticipantName}
                            </span>
                          </div>
                        </div>

                        {/* Transfer Amount */}
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span
                            className={`text-base sm:text-lg font-bold font-mono ${
                              isSettled ? 'line-through opacity-60' : 'text-[#8C6E54] dark:text-[#D4A373]'
                            }`}
                          >
                            {baseCurrInfo.symbol} {formatMoney(t.amount, baseCurrency)} {baseCurrency}
                          </span>

                          <span className="text-[11px] opacity-60">
                            {isSettled ? '已結清' : '點擊標記已結清'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: 消費分析 (Analytics & Categories) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Category Breakdown list */}
            <div
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mincho font-semibold flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                    <span>各類別支出細分 (酒店房費、餐飲、交通等)</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    總計支出：{baseCurrInfo.symbol} {formatMoney(summary.totalExpense, baseCurrency)} {baseCurrency}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(Object.keys(EXPENSE_CATEGORIES) as MainExpenseCategory[]).map((catKey) => {
                  const meta = EXPENSE_CATEGORIES[catKey];
                  const spent = summary.categoryTotals[catKey] || 0;
                  const percentage = summary.totalExpense > 0 
                    ? Math.round((spent / summary.totalExpense) * 100) 
                    : 0;

                  return (
                    <div key={catKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <span className="font-semibold">{meta.name}</span>
                          <span className="opacity-50 text-[11px]">({meta.japanese})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">
                            {baseCurrInfo.symbol} {formatMoney(spent, baseCurrency)}
                          </span>
                          <span className="text-[11px] opacity-60 w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#EFEAE1] dark:bg-[#38312A] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
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

            {/* Currency Breakdown & Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Currency Breakdown */}
              <div
                className={`p-5 rounded-3xl border ${
                  isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                }`}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  多國貨幣原幣支出統計
                </h3>
                <div className="space-y-2">
                  {Object.entries(summary.currencyTotals).map(([currCode, sumAmount]) => {
                    const cInfo = getCurrencyInfo(currCode);
                    return (
                      <div
                        key={currCode}
                        className={`flex items-center justify-between p-3 rounded-xl text-xs ${
                          isDark ? 'bg-[#2A2521]' : 'bg-[#FAF8F3]'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <span>{cInfo.flag}</span>
                          <span>{cInfo.code} ({cInfo.name})</span>
                        </div>
                        <span className="font-mono font-bold">
                          {cInfo.symbol} {(sumAmount as number).toLocaleString()} {currCode}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods */}
              <div
                className={`p-5 rounded-3xl border ${
                  isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
                }`}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  支付方式比例
                </h3>
                <div className="space-y-2">
                  {(Object.keys(PAYMENT_METHODS) as Array<keyof typeof PAYMENT_METHODS>).map((method) => {
                    const pMeta = PAYMENT_METHODS[method];
                    const methodExpenses = expenses.filter((e) => e.paymentMethod === method);
                    const methodTotal = methodExpenses.reduce((acc, e) => acc + e.convertedAmount, 0);
                    const pct = summary.totalExpense > 0 
                      ? Math.round((methodTotal / summary.totalExpense) * 100) 
                      : 0;

                    return (
                      <div
                        key={method}
                        className={`flex items-center justify-between p-3 rounded-xl text-xs ${
                          isDark ? 'bg-[#2A2521]' : 'bg-[#FAF8F3]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{pMeta.icon}</span>
                          <span className="font-medium">{pMeta.label}</span>
                          <span className="opacity-50">({methodExpenses.length}筆)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold">
                            {baseCurrInfo.symbol} {formatMoney(methodTotal, baseCurrency)}
                          </span>
                          <span className="text-[11px] opacity-60 ml-2">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: 旅伴成員與備忘 (Companions & Packing) */}
        {activeTab === 'companions' && (
          <div className="space-y-6">
            
            {/* Participants Card */}
            <div
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mincho font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                    <span>本趟旅程參與成員 ({participants.length} 人)</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    每筆消費均可指定由誰先墊付、由誰共同分攤
                  </p>
                </div>

                <button
                  onClick={onEditTrip}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                    isDark ? 'border-[#433B33] hover:bg-[#2A2521]' : 'border-[#DDD5C7] hover:bg-[#F5EFE6]'
                  }`}
                >
                  編輯成員名單
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {participants.map((p, pIdx) => {
                  const paidCount = expenses.filter((e) => e.payerId === p.id).length;
                  const balance = summary.participantBalances.find((b) => b.participant?.id === p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-[#FAF8F3] border-[#EBE4D8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-2xs"
                          style={{ backgroundColor: getParticipantColor(p, pIdx) }}
                        >
                          {(p.name || '旅').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.name || '成員'}</p>
                          <span className="text-[11px] opacity-60">
                            {p.isCurrentUser ? '登入用戶 (本人)' : '同行旅伴'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/5 dark:border-white/5 text-xs space-y-1">
                        <div className="flex justify-between opacity-70">
                          <span>出資筆數：</span>
                          <span>{paidCount} 筆</span>
                        </div>
                        <div className="flex justify-between opacity-70">
                          <span>已付總額：</span>
                          <span className="font-mono">
                            {baseCurrInfo.symbol} {formatMoney(balance?.totalPaid || 0, baseCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packing checklist */}
            <div
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mincho font-semibold">行裝行李清單</h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    旅伴出發前收拾裝備備忘
                  </p>
                </div>
              </div>

              {/* Add packing input */}
              <form onSubmit={handleAddPacking} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="新增打包物品 (例如：護照、Suica西瓜卡、轉接插頭、感冒藥)..."
                  value={newPackingInput}
                  onChange={(e) => setNewPackingInput(e.target.value)}
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isDark
                      ? 'bg-[#D4A373] text-[#1A1816]'
                      : 'bg-[#2C2622] text-[#FAF8F3]'
                  }`}
                >
                  加入清單
                </button>
              </form>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(trip.packingItems || []).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onTogglePackingItem(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      item.packed
                        ? isDark
                          ? 'bg-[#1E2E23] border-[#2B4633] opacity-60'
                          : 'bg-[#EFF8F2] border-[#CDE5D5] opacity-60'
                        : isDark
                        ? 'bg-[#2A2521] border-[#38312A]'
                        : 'bg-[#FAF8F3] border-[#EBE4D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.packed ? (
                        <CheckSquare className="w-4 h-4 text-[#3B7A4E] dark:text-[#81B29A] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 opacity-40 shrink-0" />
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
            </div>

            {/* Travel Memos / Notes */}
            <div
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#23201D] border-[#3C352E]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mincho font-semibold">旅途備忘錄 / 居酒屋訂位 / 退稅須知</h3>
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    旅行時需要隨時查看的貼心筆記
                  </p>
                </div>

                <button
                  onClick={onAddMemo}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                    isDark ? 'border-[#433B33] hover:bg-[#2A2521]' : 'border-[#DDD5C7] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增備忘</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(trip.memos || []).map((memo) => (
                  <div
                    key={memo.id}
                    className={`p-4 rounded-2xl border relative flex flex-col justify-between ${
                      isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-[#FAF8F3] border-[#EBE4D8]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold mb-1">{memo.title}</h4>
                      <p className="text-xs opacity-80 leading-relaxed whitespace-pre-line">
                        {memo.content}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] opacity-60">
                      <span>{memo.updatedAt?.split('T')[0] || memo.category}</span>
                      <button
                        onClick={() => onDeleteMemo(memo.id)}
                        className="hover:text-[#C55353] p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
