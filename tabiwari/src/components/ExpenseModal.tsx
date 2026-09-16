import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Trip, ExpenseItem, ExpenseCategory, SplitType, PaymentMethod } from '../types';
import { 
  EXPENSE_CATEGORIES, 
  PAYMENT_METHODS, 
  getCurrencyInfo 
} from '../utils/expenseConstants';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<ExpenseItem>) => void;
  initialExpense: ExpenseItem | null;
  trip: Trip;
  isDark: boolean;
}

// 內建常用貨幣選單，避免引用未導出的變數
const CURRENCY_OPTIONS = [
  { code: 'HKD', symbol: 'HK$', name: '港幣' },
  { code: 'JPY', symbol: '¥', name: '日圓' },
  { code: 'TWD', symbol: 'NT$', name: '新台幣' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '歐元' },
  { code: 'KRW', symbol: '₩', name: '韓元' },
  { code: 'CNY', symbol: '¥', name: '人民幣' },
  { code: 'GBP', symbol: '£', name: '英鎊' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  trip,
  isDark,
}) => {
  const defaultCurrency = trip.baseCurrency || 'HKD';
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [subcategory, setSubcategory] = useState('餐飲');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [involvedParticipantIds, setInvolvedParticipantIds] = useState<string[]>([]);
  const [splitDetails, setSplitDetails] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (initialExpense) {
        setTitle(initialExpense.title);
        setCategory(initialExpense.category);
        setSubcategory(initialExpense.subcategory || '');
        setAmount(initialExpense.amount ? String(initialExpense.amount) : '');
        setCurrency(initialExpense.currency);
        setExchangeRate(initialExpense.exchangeRate || 1);
        setPayerId(initialExpense.payerId);
        setSplitType(initialExpense.splitType);
        setInvolvedParticipantIds(initialExpense.involvedParticipantIds || trip.participants.map(p => p.id));
        setSplitDetails(initialExpense.splitDetails || {});
        setPaymentMethod(initialExpense.paymentMethod);
        setDate(initialExpense.date || todayStr);
        setTime(initialExpense.time || timeStr);
        setLocation(initialExpense.location || '');
        setNotes(initialExpense.notes || '');
      } else {
        setTitle('');
        setCategory('food');
        setSubcategory('餐飲');
        setAmount('');
        setCurrency(defaultCurrency);
        setExchangeRate(1);
        setPayerId(trip.participants[0]?.id || '');
        setSplitType('equal');
        setInvolvedParticipantIds(trip.participants.map(p => p.id));
        setSplitDetails({});
        setPaymentMethod('credit_card');
        setDate(todayStr);
        setTime(timeStr);
        setLocation('');
        setNotes('');
      }
    }
  }, [isOpen, initialExpense, trip, defaultCurrency]);

  if (!isOpen) return null;

  const currentCurrencyInfo = getCurrencyInfo(currency);

  const handleSave = () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    const converted = numAmount * (exchangeRate || 1);

    onSave({
      title: title.trim() || subcategory || '日常消費',
      category,
      subcategory,
      amount: numAmount,
      currency,
      exchangeRate,
      convertedAmount: converted,
      payerId: payerId || trip.participants[0]?.id,
      splitType,
      involvedParticipantIds,
      splitDetails,
      paymentMethod,
      date,
      time,
      location,
      notes,
    });

    onClose();
  };

  const toggleParticipant = (pId: string) => {
    if (involvedParticipantIds.includes(pId)) {
      if (involvedParticipantIds.length > 1) {
        setInvolvedParticipantIds(involvedParticipantIds.filter(id => id !== pId));
      }
    } else {
      setInvolvedParticipantIds([...involvedParticipantIds, pId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#38312A] text-[#EDE7DF]'
            : 'bg-[#FFFFFF] border-[#EAE3D8] text-[#2C2622]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-mincho font-bold">
            {initialExpense ? '編輯支出明細' : '新增旅途支出記帳'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* 金額與幣別 */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-80">
              消費金額 ({currency} {currentCurrencyInfo?.symbol || ''})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className={`flex-1 px-4 py-3 rounded-2xl border text-lg font-semibold focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                    : 'bg-white border-[#E2D9CC] text-[#2C2622] focus:border-[#8C6E54]'
                }`}
              />

              {/* 幣別切換 */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`px-3 py-3 rounded-2xl border text-sm font-medium focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#E2D9CC] text-[#2C2622]'
                }`}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 支出名稱 / 項目 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium opacity-80">項目說明</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：一蘭拉麵、酒店訂金、新幹線車票..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                  : 'bg-white border-[#E2D9CC] text-[#2C2622] focus:border-[#8C6E54]'
              }`}
            />
          </div>

          {/* 分類選擇 */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-80">消費分類</label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat: any) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id as ExpenseCategory);
                      setSubcategory(cat.name);
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-[#D4A373] border-[#D4A373] text-[#1A1816] font-semibold'
                          : 'bg-[#2C2622] border-[#2C2622] text-[#FAF8F3] font-semibold'
                        : isDark
                        ? 'bg-[#2A2521] border-[#433B33] opacity-70 hover:opacity-100'
                        : 'bg-white border-[#E2D9CC] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 誰先墊付付款 (Payer) */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-80">誰付款墊付？</label>
            <div className="flex flex-wrap gap-2">
              {trip.participants.map((p) => {
                const isPayer = payerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayerId(p.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isPayer
                        ? 'bg-[#3D7A64] border-[#3D7A64] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#2A2521] border-[#433B33] opacity-70 hover:opacity-100'
                        : 'bg-white border-[#E2D9CC] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.avatarColor || '#4A7C59' }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 參與分帳成員 */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-80">參與分帳人員 (點擊切換)</label>
            <div className="flex flex-wrap gap-2">
              {trip.participants.map((p) => {
                const isInvolved = involvedParticipantIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isInvolved
                        ? isDark
                          ? 'bg-[#D4A373]/20 border-[#D4A373] text-[#D4A373]'
                          : 'bg-[#8C6E54]/10 border-[#8C6E54] text-[#8C6E54]'
                        : isDark
                        ? 'bg-[#2A2521] border-[#433B33] opacity-40 line-through'
                        : 'bg-white border-[#E2D9CC] opacity-40 line-through'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 付款方式與日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium opacity-80">付款方式</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#E2D9CC] text-[#2C2622]'
                }`}
              >
                {PAYMENT_METHODS.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium opacity-80">消費日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#E2D9CC] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium border border-stone-300 dark:border-stone-700 opacity-80 hover:opacity-100 transition-opacity"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              !amount || parseFloat(amount) <= 0
                ? 'opacity-40 cursor-not-allowed bg-stone-500 text-white'
                : isDark
                ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>儲存記帳</span>
          </button>
        </div>

      </div>
    </div>
  );
};
