import React from 'react';
import { Calendar, MapPin, Plus, Edit3, Trash2, ArrowRight, Users, ReceiptText } from 'lucide-react';
import { Trip, TripSeason } from '../types';
import { formatDateRange, calculateDaysBetween } from '../utils/storage';
import { calculateTripExpenseSummary, formatMoney } from '../utils/settlementCalculator';
import { getCurrencyInfo } from '../utils/expenseConstants';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  onQuickAddExpense?: (trip: Trip) => void;
  isDark?: boolean;
}

const SEASON_BADGES: Record<TripSeason, { label: string; icon: string }> = {
  spring: { label: '春櫻', icon: '🌸' },
  summer: { label: '夏綠', icon: '🌿' },
  autumn: { label: '秋楓', icon: '🍁' },
  winter: { label: '冬雪', icon: '❄️' },
};

const STATUS_LABELS = {
  completed: { text: '已結束', bg: 'bg-[#EAE5DD] text-[#5C544E] dark:bg-[#352F28] dark:text-[#B5ABA0]' },
  ongoing: { text: '旅行中', bg: 'bg-[#E8F0E6] text-[#42693E] dark:bg-[#223326] dark:text-[#81B29A]' },
  planning: { text: '籌備中', bg: 'bg-[#EAF0F6] text-[#3D6385] dark:bg-[#202B33] dark:text-[#6BA4C4]' },
};

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onSelect,
  onEdit,
  onDelete,
  onQuickAddExpense,
  isDark = false,
}) => {
  const seasonInfo = SEASON_BADGES[trip.season] || SEASON_BADGES.spring;
  const days = calculateDaysBetween(trip.startDate, trip.endDate);

  const today = new Date().toISOString().split('T')[0];
  const isEnded = trip.status === 'completed' || (Boolean(trip.endDate) && trip.endDate < today);
  const isOngoing = !isEnded && trip.startDate <= today && trip.endDate >= today;
  const isUpcoming = !isEnded && trip.startDate > today;

  let statusBadge = {
    text: trip.status === 'planning' ? '籌備中' : '旅行中',
    bg: 'bg-[#E8F0E6] text-[#42693E] dark:bg-[#223326] dark:text-[#81B29A]',
  };

  if (isEnded) {
    statusBadge = {
      text: '已結束',
      bg: 'bg-[#EAE5DD] text-[#5C544E] dark:bg-[#352F28] dark:text-[#B5ABA0]',
    };
  } else if (isOngoing) {
    statusBadge = {
      text: '旅行中 ✈️',
      bg: 'bg-[#E8F0E6] text-[#3D6E3B] dark:bg-[#1E3023] dark:text-[#81B29A]',
    };
  } else if (isUpcoming) {
    const sTime = new Date(trip.startDate + 'T00:00:00').getTime();
    const tTime = new Date(today + 'T00:00:00').getTime();
    const diffDays = Math.ceil((sTime - tTime) / (1000 * 60 * 60 * 24));
    statusBadge = {
      text: diffDays === 1 ? '明天出發' : `倒數 ${diffDays} 天出發`,
      bg: 'bg-[#FFF3E0] text-[#B06B1F] dark:bg-[#3A2B18] dark:text-[#F3C488]',
    };
  }

  const summary = calculateTripExpenseSummary(trip);
  const baseCurrency = trip.baseCurrency || 'HKD';
  const baseCurrInfo = getCurrencyInfo(baseCurrency);
  const participants = trip.participants || [];

  const budget = trip.budget || 0;
  const budgetPercent = budget > 0 ? Math.min(100, Math.round((summary.totalExpense / budget) * 100)) : 0;

  return (
    <div
      id={`trip-card-${trip.id}`}
      className={`group relative rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col ${
        isEnded ? 'opacity-90 hover:opacity-100' : ''
      } ${
        isDark
          ? 'bg-[#23201D] border-[#38322B] hover:border-[#4E443A] text-[#EDE7DF]'
          : 'bg-[#FFFFFF] border-[#EAE3D8] hover:border-[#D5C9B8] text-[#2C2622]'
      }`}
    >
      {/* Cover Image with Japanese clean aspect ratio */}
      <div
        className="relative w-full aspect-[16/10] overflow-hidden bg-[#EFEBE4] dark:bg-[#2C2622] cursor-pointer"
        onClick={() => onSelect(trip)}
      >
        <img
          src={trip.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-black/40 backdrop-blur-md text-[#FAF7F2] border border-white/10 shadow-xs">
              <span>{seasonInfo.icon}</span>
              <span>{seasonInfo.label}</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-md text-[#FAF7F2] border border-white/20">
              {baseCurrInfo.flag} {baseCurrInfo.code} 基準
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium tracking-wide shadow-xs ${statusBadge.bg}`}>
            {statusBadge.text}
          </span>
        </div>

        {/* Bottom overlay inside image: Destination & Duration */}
        <div className="absolute bottom-3 left-3 right-3 text-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium drop-shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[#EFEAE2]">
            {days} 天旅程
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs opacity-60 mb-1.5 font-sans">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          {/* Title */}
          <h2
            onClick={() => onSelect(trip)}
            className="text-lg font-mincho font-semibold transition-colors leading-snug cursor-pointer line-clamp-1 mb-1.5 hover:text-[#8C6E54] dark:hover:text-[#D4A373]"
            title={trip.title}
          >
            {trip.title}
          </h2>

          {/* Subtitle */}
          {trip.subtitle && (
            <p className="text-xs opacity-75 font-sans line-clamp-1 leading-relaxed mb-3">
              {trip.subtitle}
            </p>
          )}

          {/* Key Expense Box */}
          <div
            className={`p-3 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-[#FAF8F3] border-[#EAE3D8]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs opacity-70 flex items-center gap-1">
                <ReceiptText className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>目前總支出</span>
              </span>
              <span className="text-base font-bold font-mono text-[#8C6E54] dark:text-[#D4A373]">
                {formatMoney(summary.totalExpense, baseCurrency)} {baseCurrency}
              </span>
            </div>

            {/* Budget progress bar */}
            {budget > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-[#E5DDD0] dark:bg-[#3C352E] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      budgetPercent > 90 ? 'bg-[#C85A53]' : 'bg-[#8C6E54] dark:bg-[#D4A373]'
                    }`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] opacity-60">
                  <span>預算 {formatMoney(budget, baseCurrency)}</span>
                  <span>已用 {budgetPercent}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Participants Avatar row */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {participants.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-[#23201D] flex items-center justify-center text-white text-[10px] font-medium"
                    style={{ backgroundColor: p.avatarColor || '#8C6E54' }}
                    title={p.name || '旅伴'}
                  >
                    {(p.name || '旅').charAt(0)}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-[#8C6E54] text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-[#23201D]">
                    +{participants.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs opacity-75">
                {participants.length} 人同遊
              </span>
            </div>

            <span className="text-xs opacity-60">
              {trip.expenses?.length || 0} 筆記帳
            </span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#F0EBE3] dark:border-[#38322B] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              id={`trip-card-edit-btn-${trip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(trip);
              }}
              className="p-1.5 rounded-lg hover:bg-[#F4EFEA] dark:hover:bg-[#322C27] opacity-60 hover:opacity-100 transition-colors"
              title="編輯旅程設定"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`trip-card-delete-btn-${trip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`確定要刪除「${trip.title}」這趟旅程及其所有記帳資料嗎？`)) {
                  onDelete(trip.id);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[#FDF2F0] dark:hover:bg-[#352020] text-[#C55353] opacity-60 hover:opacity-100 transition-colors"
              title="刪除旅程"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onQuickAddExpense && (
              <button
                id={`trip-card-quick-add-btn-${trip.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddExpense(trip);
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-[#433B33] hover:bg-[#322C27] text-[#D4A373]'
                    : 'border-[#E3D8C8] hover:bg-[#F5EFE6] text-[#8C6E54]'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>記一筆</span>
              </button>
            )}

            <button
              id={`trip-card-open-btn-${trip.id}`}
              onClick={() => onSelect(trip)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              <span>進入記帳本</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
