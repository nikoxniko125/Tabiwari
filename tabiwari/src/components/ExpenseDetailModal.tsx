import React from 'react';
import { 
  X, Calendar, Clock, MapPin, CreditCard, DollarSign, 
  Users, Edit3, Trash2, Tag, FileText 
} from 'lucide-react';
import { ExpenseItem, Trip } from '../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCurrencyInfo } from '../utils/expenseConstants';
import { getParticipantColor } from '../utils/participantUtils';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
  trip: Trip;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (expenseId: string) => void;
  isDark?: boolean;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  trip,
  onEdit,
  onDelete,
  isDark = false,
}) => {
  if (!isOpen || !expense) return null;

  const payer = trip.participants.find((p) => p.id === expense.payerId);
  const currencyInfo = getCurrencyInfo(expense.currency);
  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);
  const paymentMethodInfo = PAYMENT_METHODS.find((p) => p.id === expense.paymentMethod);

  const involvedParticipants = trip.participants.filter((p) =>
    (expense.involvedParticipantIds || []).includes(p.id)
  );

  const perPersonAmount = involvedParticipants.length > 0 
    ? expense.amount / involvedParticipants.length 
    : expense.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#38312A] text-[#EDE7DF]'
            : 'bg-[#FFFFFF] border-[#EAE3D8] text-[#2C2622]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryInfo?.icon || '💸'}</span>
            <h3 className="text-base font-mincho font-bold">支出詳細帳目</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 金額展示卡片 */}
          <div
            className={`p-5 rounded-2xl border text-center space-y-1 ${
              isDark ? 'bg-[#1C1A17] border-[#332C25]' : 'bg-[#FAF8F3] border-[#EAE3D8]'
            }`}
          >
            <span className="text-xs opacity-60 font-medium">總消費金額</span>
            <div className="text-3xl font-bold font-sans tracking-tight">
              <span className="text-lg mr-1 opacity-70">{currencyInfo.symbol}</span>
              {expense.amount.toLocaleString()}
              <span className="text-xs font-normal ml-1.5 opacity-60">{expense.currency}</span>
            </div>
            {expense.currency !== trip.baseCurrency && expense.convertedAmount && (
              <p className="text-xs text-[#8C6E54] dark:text-[#D4A373] mt-1">
                約合 {trip.baseCurrency} ${expense.convertedAmount.toFixed(1)}
              </p>
            )}
          </div>

          {/* 項目標題 */}
          <div className="space-y-1">
            <span className="text-xs font-medium opacity-60">項目說明</span>
            <p className="text-base font-semibold">{expense.title}</p>
          </div>

          {/* 墊付者與分帳資訊 */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-xs font-medium opacity-60 block mb-1">付款墊付人</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: payer?.avatarColor || getParticipantColor(payer?.name || '') }}
                />
                <span className="text-xs font-semibold">{payer?.name || '未知成員'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium opacity-60 block mb-1">人均平攤金額</span>
              <span className="text-xs font-semibold text-[#3D7A64] dark:text-[#81B29A]">
                {currencyInfo.symbol} {perPersonAmount.toFixed(1)} / 人
              </span>
            </div>
          </div>

          {/* 參與分帳成員 */}
          <div className="space-y-1.5 pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
            <span className="text-xs font-medium opacity-60 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              參與分帳成員 ({involvedParticipants.length}人)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {involvedParticipants.map((p) => (
                <span
                  key={p.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-[#FAF8F3] border-[#E2D9CC] text-[#2C2622]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.avatarColor || getParticipantColor(p.name) }}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* 付款方式與時間 */}
          <div className="grid grid-cols-2 gap-3 text-xs opacity-80 pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 opacity-60" />
              <span>{paymentMethodInfo?.name || '信用卡'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span>{expense.date}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (按鈕操作區) */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              onDelete(expense.id);
              onClose();
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>刪除此筆記錄</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(expense)}
              className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] hover:bg-[#352E28]'
                  : 'bg-white border-[#E2D9CC] text-[#2C2622] hover:bg-[#F5EFE6]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>編輯細項</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
