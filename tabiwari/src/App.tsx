/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, Plus, Search, Filter, Calendar, MapPin, Sparkles, 
  ReceiptText, Users, Download, Upload, ArrowRight, Sun, Moon, TrendingUp, Palette
} from 'lucide-react';
import { 
  Trip, ExpenseItem, PackingItem, TripMemo, TripSeason, TripStatus, AppBranding 
} from './types';
import { 
  loadTrips, saveTrips, loadTheme, saveTheme, ThemeMode,
  loadActiveTripId, saveActiveTripId, loadAppBranding, saveAppBranding 
} from './utils/storage';
import { Header } from './components/Header';
import { TripCard } from './components/TripCard';
import { TripDetailView } from './components/TripDetailView';
import { TripModal } from './components/TripModal';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { SettlementShareModal } from './components/SettlementShareModal';
import { MemoModal } from './components/MemoModal';
import { BackupModal } from './components/BackupModal';
import { LiveRateModal } from './components/LiveRateModal';
import { CustomLogoModal } from './components/CustomLogoModal';
import { calculateTripExpenseSummary, formatMoney } from './utils/settlementCalculator';
import { getCurrencyInfo } from './utils/expenseConstants';
import { applyAppBrandingToDocument } from './utils/appIconUtils';

export default function App() {
  // 1. Theme state: 優先讀取 LocalStorage 保存的模式，若無則跟隨手機系統
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = loadTheme();
    if (saved) return saved;
    // 跟隨手機系統設定 (Dark / Light)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // 2. 監聽手機系統 Theme 的變化 (例如手機設定了日落自動轉深色)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在用戶未手動強制設定過偏好時才自動隨系統轉變
      if (!localStorage.getItem('tabi_wari_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Branding customization (Custom Logo, Icon, and App Title)
  const [branding, setBranding] = useState<AppBranding>(() => loadAppBranding());

  // Apply custom branding to document title & iOS Apple Touch Icon
  useEffect(() => {
    applyAppBrandingToDocument(branding);
  }, [branding]);

  // Apply dark mode class to document element
  useEffect(() => {
    saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  // Trips collection state
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips());
  
  // Persistent active trip: restoring state when returning so edits are never lost
  const [activeTripId, setActiveTripIdState] = useState<string | null>(() => loadActiveTripId());

  const setActiveTripId = (id: string | null) => {
    setActiveTripIdState(id);
    saveActiveTripId(id);
  };

  // Filters for Trip Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<TripSeason | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Expense Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<ExpenseItem | null>(null);

  // Settlement Share Modal
  const [isSettlementShareOpen, setIsSettlementShareOpen] = useState(false);

  // Utility modals
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLiveRateModalOpen, setIsLiveRateModalOpen] = useState(false);
  const [isCustomLogoModalOpen, setIsCustomLogoModalOpen] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Save trips whenever updated (with visual save status)
  useEffect(() => {
    setSaveStatus('saving');
    saveTrips(trips);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    const timer = setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
    return () => clearTimeout(timer);
  }, [trips]);

  // Active Trip Object
  const currentTrip = useMemo(() => {
    if (!activeTripId) return null;
    return trips.find((t) => t.id === activeTripId) || null;
  }, [trips, activeTripId]);

  // Filtered and automatically sorted trips for main list
  const filteredTrips = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const matched = trips.filter((t) => {
      const matchSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSeason = seasonFilter === 'all' || t.season === seasonFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchSearch && matchSeason && matchStatus;
    });

    const isTripEnded = (t: Trip): boolean => {
      if (t.status === 'completed') return true;
      if (t.endDate && t.endDate < today) return true;
      return false;
    };

    return [...matched].sort((a, b) => {
      const aEnded = isTripEnded(a);
      const bEnded = isTripEnded(b);

      // 1. 已結束的行程自動跌至最後
      if (!aEnded && bEnded) return -1;
      if (aEnded && !bEnded) return 1;

      // 2. 未結束行程（進行中與未來即將到來的行程）
      if (!aEnded && !bEnded) {
        const aOngoing = a.startDate <= today && a.endDate >= today;
        const bOngoing = b.startDate <= today && b.endDate >= today;

        // 正在進行中的旅程置於最頂部
        if (aOngoing && !bOngoing) return -1;
        if (!aOngoing && bOngoing) return 1;

        // 由就快到至比較遠的行程由上往下排（出發日期升序）
        if (a.startDate !== b.startDate) {
          return a.startDate.localeCompare(b.startDate);
        }
        return a.endDate.localeCompare(b.endDate);
      }

      // 3. 兩者皆為已結束行程：結束日期較近的排在結束區塊前端
      if (a.endDate !== b.endDate) {
        return b.endDate.localeCompare(a.endDate);
      }
      return b.startDate.localeCompare(a.startDate);
    });
  }, [trips, searchQuery, seasonFilter, statusFilter]);

  // 分離未結束（進行中 / 未來即將到來）與已結束的旅程
  const { upcomingTrips, endedTrips } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const isTripEnded = (t: Trip) => t.status === 'completed' || (Boolean(t.endDate) && t.endDate < today);

    const upcoming: Trip[] = [];
    const ended: Trip[] = [];

    filteredTrips.forEach((t) => {
      if (isTripEnded(t)) {
        ended.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return { upcomingTrips: upcoming, endedTrips: ended };
  }, [filteredTrips]);

  // Handlers for Trip
  const handleCreateOrUpdateTrip = (tripData: Partial<Trip>) => {
    const now = new Date().toISOString();
    if (editingTrip) {
      setTrips((prev) =>
        prev.map((t) =>
          t.id === editingTrip.id
            ? ({
                ...t,
                ...tripData,
                updatedAt: now,
              } as Trip)
            : t
        )
      );
    } else {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        title: tripData.title || '新日本漫步旅程',
        subtitle: tripData.subtitle,
        destination: tripData.destination || '日本・東京',
        country: tripData.country || '日本',
        startDate: tripData.startDate || now.split('T')[0],
        endDate: tripData.endDate || now.split('T')[0],
        coverImage: tripData.coverImage || '',
        baseCurrency: tripData.baseCurrency || 'HKD',
        budget: tripData.budget,
        season: tripData.season || 'spring',
        status: tripData.status || 'ongoing',
        participants: tripData.participants || [
          { id: `p-${Date.now()}-1`, name: '我', avatarColor: '#4A7C59', isCurrentUser: true },
          { id: `p-${Date.now()}-2`, name: '阿明', avatarColor: '#D48C46' },
        ],
        expenses: [],
        packingItems: [
          { id: `pack-1`, name: '護照與機票電子憑證', packed: false, category: 'essential' },
          { id: `pack-2`, name: '國際轉換插頭', packed: false, category: 'essential' },
          { id: `pack-3`, name: '銀行卡 ／ 信用卡 ／ 現金', packed: false, category: 'essential' },
          { id: `pack-4`, name: '日常備用及急救藥物', packed: false, category: 'essential' },
          { id: `pack-5`, name: '漫遊上網SIM卡 / eSIM', packed: false, category: 'electronics' },
        ],
        memos: [],
        createdAt: now,
        updatedAt: now,
      };
      setTrips((prev) => [newTrip, ...prev]);
      setActiveTripId(newTrip.id);
    }
    setEditingTrip(null);
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    if (activeTripId === tripId) {
      setActiveTripId(null);
    }
  };

  // Handlers for Expenses (記帳 & 分帳)
  const handleSaveExpense = (expenseData: Partial<ExpenseItem>) => {
    if (!activeTripId) return;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        const currentExpenses = t.expenses ? [...t.expenses] : [];

        if (editingExpense) {
          const updated = currentExpenses.map((exp) =>
            exp.id === editingExpense.id
              ? ({
                  ...exp,
                  ...expenseData,
                } as ExpenseItem)
              : exp
          );
          return { ...t, expenses: updated, updatedAt: new Date().toISOString() };
        } else {
          const newExp: ExpenseItem = {
            id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: expenseData.title || '一般消費',
            category: expenseData.category || 'food',
            subcategory: expenseData.subcategory || '餐飲',
            amount: expenseData.amount || 0,
            currency: expenseData.currency || t.baseCurrency || 'JPY',
            exchangeRate: expenseData.exchangeRate || 1,
            convertedAmount: expenseData.convertedAmount || 0,
            payerId: expenseData.payerId || t.participants[0]?.id || 'p-1',
            splitType: expenseData.splitType || 'equal',
            involvedParticipantIds: expenseData.involvedParticipantIds || t.participants.map((p) => p.id),
            splitDetails: expenseData.splitDetails || {},
            paymentMethod: expenseData.paymentMethod || 'credit_card',
            date: expenseData.date || new Date().toISOString().split('T')[0],
            time: expenseData.time,
            location: expenseData.location,
            notes: expenseData.notes,
            receiptPhoto: expenseData.receiptPhoto,
            createdAt: new Date().toISOString(),
          };
          return { ...t, expenses: [newExp, ...currentExpenses], updatedAt: new Date().toISOString() };
        }
      })
    );

    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeTripId) return;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          expenses: (t.expenses || []).filter((e) => e.id !== expenseId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    if (selectedExpenseForDetail?.id === expenseId) {
      setSelectedExpenseForDetail(null);
    }
  };

  const handleQuickAddExpense = (trip: Trip) => {
    setActiveTripId(trip.id);
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Handlers for Packing List
  const handleAddPackingItem = (item: Omit<PackingItem, 'id'>) => {
    if (!activeTripId) return;
    const newItem: PackingItem = {
      id: `pack-${Date.now()}`,
      ...item,
    };
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          packingItems: [...(t.packingItems || []), newItem],
        };
      })
    );
  };

  const handleTogglePackingItem = (itemId: string) => {
    if (!activeTripId) return;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          packingItems: (t.packingItems || []).map((i) =>
            i.id === itemId ? { ...i, packed: !i.packed } : i
          ),
        };
      })
    );
  };

  const handleDeletePackingItem = (itemId: string) => {
    if (!activeTripId) return;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          packingItems: (t.packingItems || []).filter((i) => i.id !== itemId),
        };
      })
    );
  };

  // Handlers for Memos
  const handleSaveMemo = (memoData: Omit<TripMemo, 'id'>) => {
    if (!activeTripId) return;
    const newMemo: TripMemo = {
      id: `memo-${Date.now()}`,
      ...memoData,
    };
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          memos: [newMemo, ...(t.memos || [])],
        };
      })
    );
  };

  const handleDeleteMemo = (memoId: string) => {
    if (!activeTripId) return;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        return {
          ...t,
          memos: (t.memos || []).filter((m) => m.id !== memoId),
        };
      })
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#191715] text-[#EDE7DF]' : 'bg-[#FAF8F3] text-[#2C2622]'
    }`}>
      
      {/* Universal Top Header with Theme Switcher & Backup */}
      <Header
        trips={trips}
        theme={theme}
        branding={branding}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        onToggleTheme={toggleTheme}
        onNewTrip={() => {
          setEditingTrip(null);
          setIsTripModalOpen(true);
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onHomeClick={() => setActiveTripId(null)}
        onOpenCustomLogo={() => setIsCustomLogoModalOpen(true)}
        onOpenLiveRates={() => setIsLiveRateModalOpen(true)}
        isInsideTrip={!!currentTrip}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {currentTrip ? (
          /* Single Trip Detailed Expense & Split View */
          <TripDetailView
            trip={currentTrip}
            onBack={() => setActiveTripId(null)}
            onEditTrip={() => {
              setEditingTrip(currentTrip);
              setIsTripModalOpen(true);
            }}
            onDeleteTrip={() => handleDeleteTrip(currentTrip.id)}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onViewExpenseDetail={(expense) => setSelectedExpenseForDetail(expense)}
            onOpenSettlementShare={() => setIsSettlementShareOpen(true)}
            onOpenLiveRates={() => setIsLiveRateModalOpen(true)}
            onAddPackingItem={handleAddPackingItem}
            onTogglePackingItem={handleTogglePackingItem}
            onDeletePackingItem={handleDeletePackingItem}
            onAddMemo={() => setIsMemoModalOpen(true)}
            onDeleteMemo={handleDeleteMemo}
            isDark={isDark}
          />
        ) : (
          /* Trips Directory View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
            
            {/* Japanese Aesthetic Welcoming Banner */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#23201D] border-[#38322B] text-[#EDE7DF]'
                  : 'bg-[#FFFFFF] border-[#EAE3D8] text-[#2C2622]'
              }`}
            >
              <div className="relative z-10 max-w-2xl">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 border ${
                    isDark
                      ? 'bg-[#2F2923] border-[#433B33] text-[#D4A373]'
                      : 'bg-[#FAF5EE] border-[#EFE5D8] text-[#8C6E54]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>多人旅行記帳與分帳</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-mincho font-bold mb-2 leading-snug">
                  {branding?.appName || '旅割'} · 旅途每筆消費與旅伴分帳，清晰透明
                </h1>
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-[#ABA195]' : 'text-[#746C65]'
                  }`}
                >
                  支援多人參與、多國幣別自動換算（日圓 JPY、港幣 HKD、台幣 TWD 等）、細緻分類（酒店房費、餐飲居酒屋、交通新幹線），並自動計算每人墊付與應攤差額，一鍵生成最少轉帳清算明細。
                </p>
              </div>

              {/* Banner 右側僅保留建立新旅行按鈕 */}
              <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  id="welcome-new-trip-btn"
                  onClick={() => {
                    setEditingTrip(null);
                    setIsTripModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all shadow-xs ${
                    isDark
                      ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                      : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>建立新旅行記帳本</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div
              className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-colors ${
                isDark
                  ? 'bg-[#23201D] border-[#38312A]'
                  : 'bg-[#FAF8F3] border-[#EAE3D8]'
              }`}
            >
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
                <input
                  id="trips-search-input"
                  type="text"
                  placeholder="搜尋目的地、旅程標題、城市..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                      : 'bg-white border-[#E2D9CC] text-[#2C2622] focus:border-[#8C6E54]'
                  }`}
                />
              </div>

              {/* Season & Status Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Season pills */}
                <div
                  className={`flex items-center gap-1 p-1 rounded-xl border ${
                    isDark ? 'bg-[#2A2521] border-[#433B33]' : 'bg-white border-[#E2D9CC]'
                  }`}
                >
                  <button
                    id="filter-season-all"
                    onClick={() => setSeasonFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      seasonFilter === 'all'
                        ? isDark
                          ? 'bg-[#D4A373] text-[#1A1816]'
                          : 'bg-[#2C2622] text-[#FAF8F3]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    四季
                  </button>
                  <button
                    id="filter-season-spring"
                    onClick={() => setSeasonFilter('spring')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      seasonFilter === 'spring'
                        ? 'bg-[#C85A53] text-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    🌸 春
                  </button>
                  <button
                    id="filter-season-summer"
                    onClick={() => setSeasonFilter('summer')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      seasonFilter === 'summer'
                        ? 'bg-[#4A7C59] text-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    🌿 夏
                  </button>
                  <button
                    id="filter-season-autumn"
                    onClick={() => setSeasonFilter('autumn')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      seasonFilter === 'autumn'
                        ? 'bg-[#D48C46] text-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    🍁 秋
                  </button>
                  <button
                    id="filter-season-winter"
                    onClick={() => setSeasonFilter('winter')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      seasonFilter === 'winter'
                        ? 'bg-[#4682B4] text-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    ❄️ 冬
                  </button>
                </div>

                {/* Status selector */}
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TripStatus | 'all')}
                  className={`px-3 py-1.5 rounded-xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#E2D9CC] text-[#2C2622]'
                  }`}
                >
                  <option value="all">所有進度</option>
                  <option value="ongoing">旅行中 (記錄中)</option>
                  <option value="completed">已結束 (已結算)</option>
                  <option value="planning">籌備中 (行程)</option>
                </select>
              </div>
            </div>

            {/* Trips Grid */}
            {filteredTrips.length === 0 ? (
              <div
                className={`text-center py-16 px-4 rounded-3xl border border-dashed ${
                  isDark
                    ? 'bg-[#23201D] border-[#38312A]'
                    : 'bg-white border-[#DCD5C9]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[#FAF5EE] dark:bg-[#2F2923] text-2xl">
                  🍵
                </div>
                <h3 className="text-base font-mincho font-semibold mb-1">
                  沒有找到相符的旅程
                </h3>
                <p className={`text-xs max-w-sm mx-auto mb-4 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  {searchQuery || seasonFilter !== 'all' || statusFilter !== 'all'
                    ? '嘗試調整搜尋條件或四季標籤。'
                    : '點擊下方按鈕，開始建立你的第一趟多人旅行記帳本。'}
                </p>
                <button
                  id="empty-create-trip-btn"
                  onClick={() => {
                    setEditingTrip(null);
                    setIsTripModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                    isDark
                      ? 'bg-[#D4A373] text-[#1A1816]'
                      : 'bg-[#2C2622] text-[#FAF8F3]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>建立新旅行記帳本</span>
                </button>
              </div>
            ) : upcomingTrips.length > 0 && endedTrips.length > 0 ? (
              <div className="space-y-9">
                {/* Upcoming / Ongoing Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3D7A64] animate-pulse" />
                      <h2 className="text-sm font-semibold tracking-wide">
                        即將出發與進行中旅程
                      </h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8F0E6] text-[#42693E] dark:bg-[#223326] dark:text-[#81B29A] font-medium font-sans">
                        {upcomingTrips.length}
                      </span>
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-[#8A8175]' : 'text-[#8E857B]'}`}>
                      依出發距離由近至遠排序
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {upcomingTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onSelect={(t) => setActiveTripId(t.id)}
                        onEdit={(t) => {
                          setEditingTrip(t);
                          setIsTripModalOpen(true);
                        }}
                        onDelete={handleDeleteTrip}
                        onQuickAddExpense={handleQuickAddExpense}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>

                {/* Ended Section - Dropped to bottom */}
                <div className="space-y-4 pt-6 border-t border-dashed border-[#DDD5C7] dark:border-[#38312A]">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9E9488]" />
                      <h2 className="text-sm font-semibold tracking-wide opacity-80">
                        已結束行程（歷史回憶）
                      </h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE5DD] text-[#5C544E] dark:bg-[#352F28] dark:text-[#B5ABA0] font-medium font-sans">
                        {endedTrips.length}
                      </span>
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-[#8A8175]' : 'text-[#8E857B]'}`}>
                      已自動移至最後
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {endedTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onSelect={(t) => setActiveTripId(t.id)}
                        onEdit={(t) => {
                          setEditingTrip(t);
                          setIsTripModalOpen(true);
                        }}
                        onDelete={handleDeleteTrip}
                        onQuickAddExpense={handleQuickAddExpense}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={(t) => setActiveTripId(t.id)}
                    onEdit={(t) => {
                      setEditingTrip(t);
                      setIsTripModalOpen(true);
                    }}
                    onDelete={handleDeleteTrip}
                    onQuickAddExpense={handleQuickAddExpense}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer：左邊備份/匯入，右邊【自訂圖示(純圖標)】與【切換模式】 */}
      <footer
        className={`w-full border-t py-6 transition-colors ${
          isDark
            ? 'bg-[#201D1A] border-[#38312A] text-[#9E9488]'
            : 'bg-[#FAF8F3] border-[#EAE3D8] text-[#746C65]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* 中間： App 標題與說明 */}
          <div className="text-center space-y-1">
            <p className="font-mincho tracking-wider text-xs">
              旅割 · TABI-WARI · 旅行記帳與分帳
            </p>
            <p className="text-[11px] opacity-70">
              支援多人分帳、多國貨幣換算、細項支出統計 · 資料完整儲存於本機瀏覽器
            </p>
          </div>

          {/* 底欄左右排列 */}
          <div className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-dashed border-[#E5DDCF] dark:border-[#2D2822]">
            {/* 左下角：備份/匯入 */}
            <button
              id="footer-backup-btn"
              onClick={() => setIsBackupModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#3D352D] text-[#D0C6B8] hover:bg-[#352E28]'
                  : 'bg-[#FFFFFF] border-[#E3D8C8] text-[#5C5248] hover:bg-[#F5EFE6]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
              <span>備份/匯入 (JSON)</span>
            </button>

            {/* 右下角：自訂 Logo 圖標 + 切換深淺模式 */}
            <div className="flex items-center gap-2">
              {/* 自訂 Logo 圖示按鈕（純圖標無文字） */}
              <button
                id="footer-custom-logo-btn"
                onClick={() => setIsCustomLogoModalOpen(true)}
                title="自訂專屬 Logo 與名稱"
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-[#2A2521] border-[#3D352D] text-[#D4A373] hover:bg-[#352E28]'
                    : 'bg-[#FFFFFF] border-[#E3D8C8] text-[#8C6E54] hover:bg-[#F5EFE6]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {/* 切換模式按鈕（支援手動點擊切換） */}
              <button
                id="footer-theme-toggle-btn"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-[#2A2521] border-[#3D352D] text-[#D0C6B8] hover:bg-[#352E28]'
                    : 'bg-[#FFFFFF] border-[#E3D8C8] text-[#5C5248] hover:bg-[#F5EFE6]'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#F4C430]" />
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#8C6E54]" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Trip Modal (New / Edit Trip) */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setEditingTrip(null);
        }}
        onSave={handleCreateOrUpdateTrip}
        initialTrip={editingTrip}
        isDark={isDark}
      />

      {/* 2. Expense Modal (Add / Edit Expense) */}
      {currentTrip && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          initialExpense={editingExpense}
          trip={currentTrip}
          isDark={isDark}
        />
      )}

      {/* 3. Expense Detail Modal (Detailed split of single item) */}
      {currentTrip && (
        <ExpenseDetailModal
          isOpen={!!selectedExpenseForDetail}
          onClose={() => setSelectedExpenseForDetail(null)}
          expense={selectedExpenseForDetail}
          trip={currentTrip}
          onEdit={(exp) => {
            setSelectedExpenseForDetail(null);
            setEditingExpense(exp);
            setIsExpenseModalOpen(true);
          }}
          onDelete={handleDeleteExpense}
          isDark={isDark}
        />
      )}

      {/* 4. Settlement Share Modal (Export / Copy WhatsApp/LINE summary) */}
      {currentTrip && (
        <SettlementShareModal
          isOpen={isSettlementShareOpen}
          onClose={() => setIsSettlementShareOpen(false)}
          trip={currentTrip}
          isDark={isDark}
        />
      )}

      {/* 5. Memo Modal */}
      {currentTrip && (
        <MemoModal
          isOpen={isMemoModalOpen}
          onClose={() => setIsMemoModalOpen(false)}
          onSave={handleSaveMemo}
          trip={currentTrip}
          isDark={isDark}
        />
      )}

      {/* 6. Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        trips={trips}
        onImportSuccess={(newTrips) => {
          setTrips(newTrips);
          saveTrips(newTrips);
        }}
        onResetSuccess={(samples) => {
          setTrips(samples);
          saveTrips(samples);
        }}
        isDark={isDark}
      />

      {/* 7. Live Foreign Exchange Rates Board Modal */}
      <LiveRateModal
        isOpen={isLiveRateModalOpen}
        onClose={() => setIsLiveRateModalOpen(false)}
        baseCurrency={currentTrip ? currentTrip.baseCurrency : 'HKD'}
        isDark={isDark}
      />

      {/* 8. Custom App Logo & Branding Modal */}
      <CustomLogoModal
        isOpen={isCustomLogoModalOpen}
        onClose={() => setIsCustomLogoModalOpen(false)}
        branding={branding}
        onSaveBranding={(newBranding: AppBranding) => {
          setBranding(newBranding);
          saveAppBranding(newBranding);
          applyAppBrandingToDocument(newBranding);
        }}
        isDark={isDark}
      />

    </div>
  );
}
