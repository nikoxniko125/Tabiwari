import React from 'react';
import { 
  X, Calendar, MapPin, Users, Edit3, Trash2, FileText 
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

  const participants = trip.participants || [];
  const baseCurrency = trip.baseCurrency || 'HKD';
  
  // 安全地使用 .find() 尋找對應的分類與支付方式
  const categoryMeta = EXPENSE_CATEGORIES.find((c) => c.id === expense.category) || EXPENSE_CATEGORIES[0];
  const paymentMethodInfo = PAYMENT_METHODS.find((p) => p.id === expense.paymentMethod) || PAYMENT_METHODS[0];
  
  const currInfo = getCurrencyInfo(expense.currency);
  const baseCurrInfo = getCurrencyInfo(baseCurrency);

  const payer = participants.find((p) => p.id === expense.payerId) || {
    id: expense.payerId,
    name: '未知成員',
    avatarColor: '#8C6E54',
  };

  return (
    <div
      id="expense-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="expense-detail-dialog"
        className={`w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden my-6 transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#3C352E] text-[#EDE7DF]'
            : 'bg-[#FAF8F3] border-[#E8E1D5] text-[#2C2622]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-start justify-between relative ${
            isDark ? 'bg-[#2A2521] border-[#3C352E]' : 'bg-[#FAF5EE] border-[#E8E1D5]'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-white/40 dark:bg-black/20 shadow-2xs">
              {categoryMeta.icon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/70 dark:bg-black/30">
                  {categoryMeta.name} {expense.subcategory ? `· ${expense.subcategory}` : ''}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 opacity-80">
                  {paymentMethodInfo.icon} {paymentMethodInfo.name}
                </span>
              </div>
              <h2 className="text-xl font-mincho font-semibold leading-snug">
                {expense.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Key Details */}
        <div className="p-6 space-y-6">
          
          {/* Large Amount Display */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div>
              <p className="text-xs opacity-60">消費原幣金額</p>
              <p className="text-2xl font-bold font-mono">
                {currInfo.symbol} {expense.amount.toLocaleString()} <span className="text-sm font-normal">{expense.currency}</span>
              </p>
            </div>

            {expense.currency !== baseCurrency && (
              <div className="text-right">
                <p className="text-xs opacity-60">折合基準貨幣 (1:{expense.exchangeRate})</p>
                <p className="text-lg font-semibold font-mono text-[#8C6E54] dark:text-[#D4A373]">
                  {baseCurrInfo.symbol} {(expense.convertedAmount || (expense.amount * expense.exchangeRate)).toLocaleString()} {baseCurrency}
                </p>
              </div>
            )}
          </div>

          {/* Who Paid & When */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <p className="opacity-60 mb-1">付款人 (誰先付的)</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-medium"
                  style={{ backgroundColor: payer.avatarColor || getParticipantColor(payer.name) }}
                >
                  {(payer.name || '旅').charAt(0)}
                </div>
                <span className="font-semibold text-sm truncate">{payer.name}</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              <p className="opacity-60 mb-1">消費時間</p>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                <span>{expense.date}</span>
                {expense.time && <span>· {expense.time}</span>}
              </div>
            </div>
          </div>

          {/* Location & Notes */}
          {(expense.location || expense.notes) && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
              }`}
            >
              {expense.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373] shrink-0" />
                  <span>{expense.location}</span>
                </div>
              )}
              {expense.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 opacity-60 shrink-0 mt-0.5" />
                  <p className="leading-relaxed opacity-90">{expense.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Split Breakdown */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  分攤明細 (邊個用咗幾多錢)
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF5EE] dark:bg-[#322A22] text-[#8C6E54] dark:text-[#D4A373]">
                {expense.splitType === 'equal' && '均等平分'}
                {expense.splitType === 'custom' && '自訂金額'}
                {expense.splitType === 'personal' && '個人專屬支出'}
              </span>
            </div>

            <div className="space-y-2">
              {participants.map((p) => {
                const shareAmount = expense.splitDetails?.[p.id] ?? 0;
                const isPayer = p.id === expense.payerId;
                const totalAmt = expense.convertedAmount || (expense.amount * expense.exchangeRate);
                const percent = totalAmt > 0 ? Math.round((shareAmount / totalAmt) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      shareAmount > 0
                        ? isDark
                          ? 'bg-[#322C27]'
                          : 'bg-[#FAF8F3]'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
                        style={{ backgroundColor: p.avatarColor || getParticipantColor(p.name) }}
                      >
                        {(p.name || '旅').charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium">{p.name || '成員'}</span>
                        {isPayer && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-[#EFEAE1] dark:bg-[#433B33]">
                            已付全額
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {shareAmount > 0 ? (
                        <>
                          <span className="font-mono font-semibold">
                            {baseCurrInfo.symbol} {shareAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] opacity-60 ml-1.5">({percent}%)</span>
                        </>
                      ) : (
                        <span className="text-[11px] opacity-50">未參與此項</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EBE4D8] dark:border-[#38322B]">
            <button
              onClick={() => {
                if (confirm(`確定要刪除「${expense.title}」這筆記帳嗎？`)) {
                  onDelete(expense.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-[#C55353] hover:bg-[#FDF2F0] dark:hover:bg-[#352020] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>刪除記帳</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-[#E3D8C8] dark:border-[#433B33] hover:bg-[#F5EFE6] dark:hover:bg-[#322C27] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>編輯資料</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
