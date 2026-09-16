import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, Calendar, Clock, MapPin, Tag, Users, Check, 
  HelpCircle, CreditCard, ChevronDown, Sparkles, Image as ImageIcon,
  CheckSquare, Square, RefreshCw, RotateCcw, AlertCircle
} from 'lucide-react';
import { 
  ExpenseItem, MainExpenseCategory, Participant, PaymentMethod, 
  SplitType, Trip 
} from '../types';
import { 
  EXPENSE_CATEGORIES, POPULAR_CURRENCIES, PAYMENT_METHODS, 
  getDefaultExchangeRate, getCurrencyInfo 
} from '../utils/expenseConstants';
import { fileToBase64, saveExpenseDraft, loadExpenseDraft, clearExpenseDraft } from '../utils/storage';
import { calculateLiveExchangeRate, fetchLiveRates, loadCachedRates, formatTimeAgo } from '../utils/exchangeRateService';
import { getParticipantColor } from '../utils/participantUtils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<ExpenseItem>) => void;
  initialExpense?: ExpenseItem | null;
  trip: Trip;
  isDark?: boolean;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  trip,
  isDark = false,
}) => {
  const participants = trip.participants || [];
  const baseCurrency = trip.baseCurrency || 'HKD';

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MainExpenseCategory>('food');
  const [subcategory, setSubcategory] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [customRate, setCustomRate] = useState(false);
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [involvedParticipantIds, setInvolvedParticipantIds] = useState<string[]>([]);
  const [customSplitAmounts, setCustomSplitAmounts] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState('');
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const [isSyncingRate, setIsSyncingRate] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      setRestoredFromDraft(false);
      setTitle(initialExpense.title || '');
      setCategory(initialExpense.category || 'food');
      setSubcategory(initialExpense.subcategory || '');
      setAmountStr(initialExpense.amount?.toString() || '');
      setCurrency(initialExpense.currency || trip.baseCurrency);
      setExchangeRate(initialExpense.exchangeRate || 1);
      setCustomRate(true);
      setPayerId(initialExpense.payerId || participants[0]?.id || '');
      setSplitType(initialExpense.splitType || 'equal');
      setInvolvedParticipantIds(
        initialExpense.involvedParticipantIds || participants.map((p) => p.id)
      );

      // Custom split details
      const customMap: Record<string, string> = {};
      if (initialExpense.splitDetails) {
        Object.entries(initialExpense.splitDetails).forEach(([pid, val]) => {
          customMap[pid] = val.toString();
        });
      }
      setCustomSplitAmounts(customMap);

      setPaymentMethod(initialExpense.paymentMethod || 'credit_card');
      setDate(initialExpense.date || new Date().toISOString().split('T')[0]);
      setTime(initialExpense.time || '12:00');
      setLocation(initialExpense.location || '');
      setNotes(initialExpense.notes || '');
      setReceiptPhoto(initialExpense.receiptPhoto || '');
    } else {
      // Check for saved draft first!
      const draft = loadExpenseDraft(trip.id);
      if (draft && draft.data && (draft.data.title || draft.data.amount || draft.data.notes || draft.data.location)) {
        const d = draft.data;
        setTitle(d.title || '');
        setCategory(d.category || 'food');
        setSubcategory(d.subcategory || EXPENSE_CATEGORIES.food.subcategories[0]);
        setAmountStr(d.amount ? d.amount.toString() : '');
        setCurrency(d.currency || (trip.destination.includes('日本') ? 'JPY' : trip.baseCurrency));
        const liveRate = calculateLiveExchangeRate(d.currency || 'JPY', baseCurrency);
        setExchangeRate(d.exchangeRate || liveRate);
        setCustomRate(d.exchangeRate !== undefined && d.exchangeRate !== liveRate);
        setPayerId(d.payerId || participants[0]?.id || '');
        setSplitType(d.splitType || 'equal');
        setInvolvedParticipantIds(d.involvedParticipantIds || participants.map((p) => p.id));
        const customMap: Record<string, string> = {};
        if (d.splitDetails) {
          Object.entries(d.splitDetails).forEach(([pid, val]) => {
            customMap[pid] = val.toString();
          });
        }
        setCustomSplitAmounts(customMap);
        setPaymentMethod(d.paymentMethod || 'credit_card');
        setDate(d.date || new Date().toISOString().split('T')[0]);
        setTime(d.time || '12:00');
        setLocation(d.location || '');
        setNotes(d.notes || '');
        setReceiptPhoto(d.receiptPhoto || '');
        setRestoredFromDraft(true);
      } else {
        setRestoredFromDraft(false);
        const defaultCurr = trip.destination.includes('日本') ? 'JPY' : trip.baseCurrency;
        const defaultRate = calculateLiveExchangeRate(defaultCurr, baseCurrency);

        setTitle('');
        setCategory('food');
        setSubcategory(EXPENSE_CATEGORIES.food.subcategories[0]);
        setAmountStr('');
        setCurrency(defaultCurr);
        setExchangeRate(defaultRate);
        setCustomRate(false);

        // Default payer: current user or first participant
        const current = participants.find((p) => p.isCurrentUser) || participants[0];
        setPayerId(current ? current.id : '');

        setSplitType('equal');
        setInvolvedParticipantIds(participants.map((p) => p.id));
        setCustomSplitAmounts({});
        setPaymentMethod('credit_card');
        setDate(new Date().toISOString().split('T')[0]);
        setTime(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
        setLocation('');
        setNotes('');
        setReceiptPhoto('');
      }
    }
  }, [isOpen, initialExpense, trip, participants, baseCurrency]);

  // Auto-save form draft so leaving or switching tabs will NEVER lose user input
  useEffect(() => {
    if (!isOpen || initialExpense) return;

    const hasContent = title.trim() || amountStr.trim() || notes.trim() || location.trim();
    if (hasContent) {
      saveExpenseDraft({
        tripId: trip.id,
        editingExpenseId: null,
        savedAt: new Date().toISOString(),
        data: {
          title,
          category,
          subcategory,
          amount: parseFloat(amountStr) || 0,
          currency,
          exchangeRate,
          payerId,
          splitType,
          involvedParticipantIds,
          paymentMethod,
          date,
          time,
          location,
          notes,
          receiptPhoto,
        },
      });
    }
  }, [
    isOpen, trip.id, initialExpense, title, category, subcategory, amountStr,
    currency, exchangeRate, payerId, splitType, involvedParticipantIds,
    paymentMethod, date, time, location, notes, receiptPhoto
  ]);

  const handleDiscardDraft = () => {
    clearExpenseDraft(trip.id);
    setRestoredFromDraft(false);
    setTitle('');
    setAmountStr('');
    setLocation('');
    setNotes('');
    setReceiptPhoto('');
    const defaultCurr = trip.destination.includes('日本') ? 'JPY' : trip.baseCurrency;
    setCurrency(defaultCurr);
    setExchangeRate(calculateLiveExchangeRate(defaultCurr, baseCurrency));
    setCustomRate(false);
  };

  const handleSyncLiveRate = async () => {
    setIsSyncingRate(true);
    await fetchLiveRates(true);
    const updated = calculateLiveExchangeRate(currency, baseCurrency);
    setExchangeRate(updated);
    setCustomRate(false);
    setIsSyncingRate(false);
  };

  // Update default subcategory when category changes
  const handleCategoryChange = (newCat: MainExpenseCategory) => {
    setCategory(newCat);
    const subcats = EXPENSE_CATEGORIES[newCat].subcategories;
    if (!subcats.includes(subcategory)) {
      setSubcategory(subcats[0]);
    }
  };

  // Update exchange rate when currency changes (unless user manually fixed it)
  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    if (!customRate) {
      const rate = calculateLiveExchangeRate(newCode, baseCurrency);
      setExchangeRate(rate);
    }
  };

  // Numeric amount calculation
  const parsedAmount = parseFloat(amountStr) || 0;
  const convertedBaseAmount = Math.round(parsedAmount * exchangeRate * 10) / 10;

  // Toggle involved participant for equal split
  const toggleInvolvedParticipant = (pId: string) => {
    if (involvedParticipantIds.includes(pId)) {
      if (involvedParticipantIds.length <= 1) return; // keep at least 1
      setInvolvedParticipantIds(involvedParticipantIds.filter((id) => id !== pId));
    } else {
      setInvolvedParticipantIds([...involvedParticipantIds, pId]);
    }
  };

  // Quick fill custom split equally
  const handleFillCustomEqually = () => {
    if (participants.length === 0 || convertedBaseAmount <= 0) return;
    const perPerson = Math.round((convertedBaseAmount / participants.length) * 10) / 10;
    const map: Record<string, string> = {};
    participants.forEach((p) => {
      map[p.id] = perPerson.toString();
    });
    setCustomSplitAmounts(map);
  };

  // Custom split sum validation
  const customSum = Object.values(customSplitAmounts).reduce(
    (acc, val) => acc + (parseFloat(val) || 0),
    0
  );
  const customRemaining = Math.round((convertedBaseAmount - customSum) * 10) / 10;

  // File upload for receipt
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setReceiptPhoto(base64);
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || parsedAmount <= 0) return;

    // Calculate final splitDetails in baseCurrency
    const splitDetails: Record<string, number> = {};

    if (splitType === 'equal') {
      const involved = involvedParticipantIds.length > 0 
        ? involvedParticipantIds 
        : participants.map((p) => p.id);
      const share = Math.round((convertedBaseAmount / involved.length) * 10) / 10;
      involved.forEach((pId) => {
        splitDetails[pId] = share;
      });
    } else if (splitType === 'personal') {
      splitDetails[payerId] = convertedBaseAmount;
    } else {
      // Custom
      participants.forEach((p) => {
        const val = parseFloat(customSplitAmounts[p.id]) || 0;
        if (val > 0) {
          splitDetails[p.id] = Math.round(val * 10) / 10;
        }
      });
    }

    const finalInvolved = splitType === 'personal' 
      ? [payerId] 
      : (splitType === 'equal' ? involvedParticipantIds : Object.keys(splitDetails));

    onSave({
      title: title.trim(),
      category,
      subcategory,
      amount: parsedAmount,
      currency,
      exchangeRate,
      convertedAmount: convertedBaseAmount,
      payerId: payerId || participants[0]?.id || 'p-1',
      splitType,
      involvedParticipantIds: finalInvolved,
      splitDetails,
      paymentMethod,
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
      receiptPhoto: receiptPhoto || undefined,
    });

    clearExpenseDraft(trip.id);
    onClose();
  };

  if (!isOpen) return null;

  const currentCategoryMeta = EXPENSE_CATEGORIES[category];
  const currInfo = getCurrencyInfo(currency);
  const baseCurrInfo = getCurrencyInfo(baseCurrency);

  return (
    <div
      id="expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="expense-modal-dialog"
        className={`w-full max-w-2xl rounded-3xl border shadow-xl overflow-hidden my-6 transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#3C352E] text-[#EDE7DF]'
            : 'bg-[#FAF8F3] border-[#E8E1D5] text-[#2C2622]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#38322B] bg-[#2A2521]' : 'border-[#EBE4D8] bg-[#F4EFE6]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentCategoryMeta.icon}</span>
            <div>
              <h2 className="text-lg font-mincho font-semibold">
                {initialExpense ? '編輯消費項目' : '記錄新消費・分帳'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-[#A09689]' : 'text-[#7D756C]'}`}>
                {trip.title} · 基準貨幣: {baseCurrInfo.flag} {baseCurrInfo.code}
              </p>
            </div>
          </div>

          <button
            id="expense-modal-close-btn"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark
                ? 'text-[#9E9488] hover:bg-[#352F28] hover:text-[#EDE7DF]'
                : 'text-[#7D756C] hover:bg-[#EAE0D0] hover:text-[#2C2622]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Draft Restored Banner */}
          {restoredFromDraft && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
                isDark
                  ? 'bg-[#332A20] border-[#5A4530] text-[#E8C59A]'
                  : 'bg-[#FFF8EC] border-[#F2DEBF] text-[#8C5D23]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#C28B38]" />
                <span>已為您自動復原上次退出前未儲存的記帳草稿</span>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="inline-flex items-center gap-1 text-[11px] underline opacity-80 hover:opacity-100 font-medium shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>捨棄草稿</span>
              </button>
            </div>
          )}

          {/* Auto-save status indication */}
          <div className="flex items-center justify-between text-[11px] text-[#7D756C] dark:text-[#9E9488] px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              即時自動保存草稿中 · 切換至其他 App 或分頁絕不遺失
            </span>
            <span className="hidden sm:inline opacity-70">支援外幣即時行情換算</span>
          </div>
          
          {/* 1. Main Category Grid Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5">
              1. 支出類別 (分得更細緻)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(EXPENSE_CATEGORIES) as MainExpenseCategory[]).map((catKey) => {
                const meta = EXPENSE_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    id={`expense-cat-btn-${catKey}`}
                    onClick={() => handleCategoryChange(catKey)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? isDark
                          ? 'border-[#D4A373] bg-[#3A3025] text-[#F5EDE4] shadow-xs'
                          : 'border-[#8C6E54] bg-[#F2ECE1] text-[#2C2622] font-semibold shadow-xs'
                        : isDark
                        ? 'border-[#38322B] bg-[#2A2521] text-[#A89F95] hover:bg-[#322C27]'
                        : 'border-[#EAE3D8] bg-[#FFFFFF] text-[#6A625A] hover:bg-[#F9F6F0]'
                    }`}
                  >
                    <span className="text-xl mb-1">{meta.icon}</span>
                    <span className="text-xs">{meta.name}</span>
                    <span className="text-[10px] opacity-70 scale-90">{meta.japanese}</span>
                  </button>
                );
              })}
            </div>

            {/* Subcategory Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className={`text-[11px] font-medium mr-1 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                細項：
              </span>
              {currentCategoryMeta.subcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubcategory(sub)}
                  className={`px-2.5 py-1 rounded-xl text-xs transition-colors ${
                    subcategory === sub
                      ? isDark
                        ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                        : 'bg-[#8C6E54] text-[#FAF8F3] font-medium'
                      : isDark
                      ? 'bg-[#2E2924] text-[#B5ABA0] hover:bg-[#38312A]'
                      : 'bg-[#EFEAE1] text-[#5C5248] hover:bg-[#E5DDD0]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Expense Title / Store */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              2. 消費項目名稱 / 地點商家 <span className="text-[#C85A53]">*</span>
            </label>
            <input
              id="expense-title-input"
              type="text"
              required
              placeholder="例如：淺草豪景酒店房費、一蘭拉麵、新宿居酒屋、京都新幹線車票..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                  : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622] focus:border-[#8C6E54]'
              }`}
            />
          </div>

          {/* 3. Amount & Currency & Exchange Rate (Core Multi-currency support) */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider">
                3. 金額與貨幣換算 (支援多國幣別) <span className="text-[#C85A53]">*</span>
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleSyncLiveRate}
                  disabled={isSyncingRate}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    isDark ? 'text-[#D4A373] hover:text-[#E2B78D]' : 'text-[#8C6E54] hover:text-[#6D543F]'
                  }`}
                  title="向國際外匯行情伺服器查詢並更新最新即時匯率"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingRate ? 'animate-spin' : ''}`} />
                  <span>{isSyncingRate ? '更新中...' : '同步即時匯率'}</span>
                </button>
                <span className="opacity-30">|</span>
                <button
                  type="button"
                  onClick={() => setCustomRate(!customRate)}
                  className={`text-[11px] underline transition-colors ${
                    isDark ? 'text-[#D4A373] hover:text-[#E2B78D]' : 'text-[#8C6E54] hover:text-[#6D543F]'
                  }`}
                >
                  {customRate ? '使用即時匯率' : '自訂匯率'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Currency Selector */}
              <div className="sm:col-span-4">
                <label className={`block text-[11px] mb-1 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  消費貨幣
                </label>
                <div className="relative">
                  <select
                    id="expense-currency-select"
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-medium border focus:outline-none ${
                      isDark
                        ? 'bg-[#322C27] border-[#4A4137] text-[#EDE7DF]'
                        : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                    }`}
                  >
                    {POPULAR_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.name} {c.symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none opacity-60" />
                </div>
              </div>

              {/* Amount Input */}
              <div className="sm:col-span-8">
                <label className={`block text-[11px] mb-1 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  消費金額 ({currInfo.symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-sm font-semibold opacity-60">
                    {currInfo.symbol}
                  </span>
                  <input
                    id="expense-amount-input"
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className={`w-full pl-8 pr-3.5 py-2 rounded-xl text-base font-semibold border focus:outline-none ${
                      isDark
                        ? 'bg-[#322C27] border-[#4A4137] text-[#EDE7DF] focus:border-[#D4A373]'
                        : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622] focus:border-[#8C6E54]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Exchange rate info banner */}
            <div
              className={`mt-3 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border ${
                isDark
                  ? 'bg-[#201D1A] border-[#38312A] text-[#B8AEA2]'
                  : 'bg-[#F7F3EC] border-[#E8DFD0] text-[#6A625A]'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span>換算至本旅程基準幣 ({baseCurrInfo.flag} {baseCurrInfo.code}):</span>
                {customRate ? (
                  <div className="inline-flex items-center gap-1.5">
                    <span>1 {currency} = </span>
                    <input
                      type="number"
                      step="any"
                      min="0.00001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                      className={`w-20 px-2 py-0.5 rounded border text-xs font-mono ${
                        isDark ? 'bg-[#2A2521] border-[#4A4137]' : 'bg-white border-[#DDD5C7]'
                      }`}
                    />
                    <span>{baseCurrency}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      手動自訂
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 font-mono">
                    <span>1 {currency} = {exchangeRate} {baseCurrency}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-sans font-medium">
                      即時牌價
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 font-semibold text-sm">
                <span>折合約：</span>
                <span className={isDark ? 'text-[#D4A373]' : 'text-[#8C6E54]'}>
                  {baseCurrInfo.symbol} {convertedBaseAmount.toLocaleString()} {baseCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Who Paid (付款人) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              4. 誰負責付款？ (邊個俾咗錢) <span className="text-[#C85A53]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {participants.map((p, pIdx) => {
                const isPayer = payerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    id={`expense-payer-btn-${p.id}`}
                    onClick={() => setPayerId(p.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                      isPayer
                        ? isDark
                          ? 'bg-[#3A3025] border-[#D4A373] shadow-xs'
                          : 'bg-[#F2ECE1] border-[#8C6E54] shadow-xs font-semibold'
                        : isDark
                        ? 'bg-[#2A2521] border-[#38322B] hover:bg-[#322C27]'
                        : 'bg-[#FFFFFF] border-[#E8E1D5] hover:bg-[#F9F6F0]'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: getParticipantColor(p, pIdx) }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{p.name}</p>
                      {p.isCurrentUser && (
                        <span className="text-[10px] opacity-60">本人</span>
                      )}
                    </div>
                    {isPayer && <Check className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. How to Split (邊個用咗幾多錢 / 分帳方式) */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider">
                5. 分帳方式 (邊個用咗幾多錢)
              </label>

              {/* Split type segmented tabs */}
              <div
                className={`inline-flex p-1 rounded-xl border text-xs ${
                  isDark ? 'bg-[#201D1A] border-[#38312A]' : 'bg-[#F5EFE6] border-[#E5DDD0]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    splitType === 'equal'
                      ? isDark
                        ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                        : 'bg-[#2C2622] text-[#FAF8F3] font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  均等平分
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    splitType === 'custom'
                      ? isDark
                        ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                        : 'bg-[#2C2622] text-[#FAF8F3] font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  自訂金額
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('personal')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    splitType === 'personal'
                      ? isDark
                        ? 'bg-[#D4A373] text-[#1A1816] font-medium'
                        : 'bg-[#2C2622] text-[#FAF8F3] font-medium'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  個人專屬
                </button>
              </div>
            </div>

            {/* Split Details by Mode */}
            {splitType === 'equal' && (
              <div className="space-y-3">
                <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  勾選參與分攤的成員（預設全員參與，可取消未參與者）：
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {participants.map((p) => {
                    const isChecked = involvedParticipantIds.includes(p.id);
                    const share = involvedParticipantIds.length > 0 
                      ? Math.round((convertedBaseAmount / involvedParticipantIds.length) * 10) / 10
                      : 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleInvolvedParticipant(p.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? isDark
                              ? 'bg-[#322A22] border-[#D4A373]'
                              : 'bg-[#FAF5EE] border-[#8C6E54]'
                            : isDark
                            ? 'bg-[#201D1A] border-[#38312A] opacity-50'
                            : 'bg-[#FAF8F3] border-[#E8E1D5] opacity-50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 opacity-40 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          {isChecked && (
                            <p className="text-[10px] opacity-70">
                              {baseCurrInfo.symbol} {share.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs font-medium text-right mt-1 opacity-80">
                  共 {involvedParticipantIds.length} 人參與 · 每人分攤約 {baseCurrInfo.symbol}{' '}
                  {involvedParticipantIds.length > 0 
                    ? (Math.round((convertedBaseAmount / involvedParticipantIds.length) * 10) / 10).toLocaleString() 
                    : 0}{' '}
                  {baseCurrency}
                </p>
              </div>
            )}

            {splitType === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                    請分別輸入每位成員各自用咗幾多錢 (單位: {baseCurrency})：
                  </p>
                  <button
                    type="button"
                    onClick={handleFillCustomEqually}
                    className={`text-xs underline ${
                      isDark ? 'text-[#D4A373]' : 'text-[#8C6E54]'
                    }`}
                  >
                    平均自動填入
                  </button>
                </div>

                <div className="space-y-2">
                  {participants.map((p, pIdx) => {
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                          isDark ? 'bg-[#201D1A] border-[#38312A]' : 'bg-[#FAF8F3] border-[#E8E1D5]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: getParticipantColor(p, pIdx) }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium">{p.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs opacity-60">{baseCurrInfo.symbol}</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={customSplitAmounts[p.id] || ''}
                            onChange={(e) =>
                              setCustomSplitAmounts({
                                ...customSplitAmounts,
                                [p.id]: e.target.value,
                              })
                            }
                            className={`w-28 px-2.5 py-1 rounded-lg text-xs font-semibold border text-right focus:outline-none ${
                              isDark
                                ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                                : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Split Check Banner */}
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
                    Math.abs(customRemaining) <= 0.1
                      ? isDark
                        ? 'bg-[#202E24] border-[#2F4A37] text-[#81B29A]'
                        : 'bg-[#EFF8F2] border-[#CDE5D5] text-[#3B7A4E]'
                      : isDark
                      ? 'bg-[#352520] border-[#4E322A] text-[#E07A5F]'
                      : 'bg-[#FDF2F0] border-[#F2D0C9] text-[#C55353]'
                  }`}
                >
                  <span>已分配: {baseCurrInfo.symbol} {customSum.toLocaleString()}</span>
                  <span>
                    {Math.abs(customRemaining) <= 0.1
                      ? '✓ 金額剛好配齊'
                      : customRemaining > 0
                      ? `尚欠 ${baseCurrInfo.symbol} ${customRemaining} 未分配`
                      : `超出總額 ${baseCurrInfo.symbol} ${Math.abs(customRemaining)}`}
                  </span>
                </div>
              </div>
            )}

            {splitType === 'personal' && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] dark:bg-[#201D1A] border border-[#E8E1D5] dark:border-[#38312A] text-xs">
                <p>
                  此筆為付款人 <strong>{participants.find((p) => p.id === payerId)?.name || '該成員'}</strong> 的專屬個人消費（如自己買的紀念品、私人物品），
                  不需與其他朋友分攤，但會記錄在個人的總開支中。
                </p>
              </div>
            )}
          </div>

          {/* 6. Payment Method & Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Payment method */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">支付方式</label>
              <select
                id="expense-payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622]'
                }`}
              >
                {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHODS[method].icon} {PAYMENT_METHODS[method].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">消費日期</label>
              <input
                id="expense-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">時間</label>
              <input
                id="expense-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

          {/* 7. Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">地點 / 城市區域 (選填)</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 opacity-40" />
                <input
                  type="text"
                  placeholder="例如：新宿區、京都河原町、築地市場..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">備註說明 (選填)</label>
              <input
                type="text"
                placeholder="例如：含晚餐懷石料理、阿明已預先轉帳..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

          {/* 8. Optional Receipt Photo */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">收據 / 菜單或單據相片 (選填)</label>
            <div className="flex items-center gap-3">
              <label className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#3D352D] hover:bg-[#352E28]'
                  : 'bg-[#FFFFFF] border-[#DDD5C7] hover:bg-[#F5EFE6]'
              }`}>
                <ImageIcon className="w-4 h-4 opacity-70" />
                <span>{receiptPhoto ? '更換收據相片' : '上傳收據相片'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {receiptPhoto && (
                <div className="relative group">
                  <img
                    src={receiptPhoto}
                    alt="Receipt"
                    className="w-10 h-10 rounded-lg object-cover border border-[#E8E1D5]"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptPhoto('')}
                    className="absolute -top-1.5 -right-1.5 bg-[#C85A53] text-white rounded-full p-0.5 text-[10px]"
                    title="移除相片"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-3 ${
              isDark ? 'border-[#38322B]' : 'border-[#EBE4D8]'
            }`}
          >
            <button
              type="button"
              id="expense-modal-cancel-btn"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                isDark
                  ? 'border-[#433B33] text-[#B5ABA0] hover:bg-[#2A2521]'
                  : 'border-[#DDD5C7] text-[#6A625A] hover:bg-[#F5EFE6]'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              id="expense-modal-submit-btn"
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              {initialExpense ? '儲存變更' : '新增此筆記帳'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
