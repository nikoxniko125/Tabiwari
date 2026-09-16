import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { Trip } from '../types';
import { calculateTripExpenseSummary, formatMoney } from '../utils/settlementCalculator';
import { getCurrencyInfo } from '../utils/expenseConstants';

interface SettlementShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  isDark?: boolean;
}

export const SettlementShareModal: React.FC<SettlementShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  isDark = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const summary = calculateTripExpenseSummary(trip);
  const baseCurrency = trip.baseCurrency || 'HKD';
  const baseCurrInfo = getCurrencyInfo(baseCurrency);

  // Construct text for copy & paste
  const lines: string[] = [
    `🌸【${trip.title}】旅行結算帳單 🌸`,
    `📍 目的地：${trip.destination}`,
    `📅 日期：${trip.startDate} ~ ${trip.endDate}`,
    `💰 總支出：${formatMoney(summary.totalExpense, baseCurrency)} ${baseCurrency}`,
    `--------------------------------`,
    `📊【各人支出與分攤總覽】`,
    ...summary.participantBalances.map((b) => {
      const pName = b.participant?.name || '旅伴';
      const netStr = b.netBalance > 0
        ? `【應收回 +${formatMoney(b.netBalance, baseCurrency)}】`
        : b.netBalance < 0
        ? `【應補付 ${formatMoney(b.netBalance, baseCurrency)}】`
        : `【已平帳 0】`;
      return `• ${pName}：已付 ${formatMoney(b.totalPaid, baseCurrency)} / 應攤 ${formatMoney(b.totalShare, baseCurrency)} ➡️ ${netStr}`;
    }),
    `--------------------------------`,
    `🔄【建議清算轉帳方式】(最少次數清算)`,
    ...(summary.settlementTransfers.length === 0
      ? ['🎉 太棒了！大家的帳目已經完全平帳，無需互相轉帳。']
      : summary.settlementTransfers.map((t, i) => {
          return `${i + 1}. ${t.fromParticipantName} ➡️ 轉帳給 ${t.toParticipantName}：${formatMoney(t.amount, baseCurrency)} ${baseCurrency}`;
        })),
    `--------------------------------`,
    `✨ 由「旅割・旅行記帳」自動計算產生`,
  ];

  const shareText = lines.join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      id="settlement-share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="settlement-share-dialog"
        className={`w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden my-6 transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#3C352E] text-[#EDE7DF]'
            : 'bg-[#FAF8F3] border-[#E8E1D5] text-[#2C2622]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#38322B] bg-[#2A2521]' : 'border-[#EBE4D8] bg-[#F4EFE6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#8C6E54] dark:text-[#D4A373]" />
            <h2 className="text-base font-mincho font-semibold">
              匯出結算清單 (分享給旅伴)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs opacity-70">
            可一鍵複製文字，直接發送到 WhatsApp、LINE 群組或 Email 給旅伴確認款項：
          </p>

          {/* Preformatted Text Preview */}
          <div
            className={`p-4 rounded-2xl border text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto ${
              isDark
                ? 'bg-[#1D1B18] border-[#38312A] text-[#EDE7DF]'
                : 'bg-white border-[#E8E1D5] text-[#2C2622]'
            }`}
          >
            {shareText}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#8C6E54] dark:text-[#D4A373] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>已按最少轉帳次數演算法平衡</span>
            </span>

            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs ${
                copied
                  ? 'bg-[#6A8D73] text-white'
                  : isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已複製到剪貼簿！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>一鍵複製結算明細</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
