import { LiveExchangeRates } from '../types';
import { getDefaultExchangeRate } from './expenseConstants';

const RATES_CACHE_KEY = 'tabiki_live_rates_cache_v2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

export interface LiveRatesState {
  rates: Record<string, number>;
  base: string;
  lastUpdatedText: string;
  lastUpdatedUnix: number;
  isLoading: boolean;
  error: string | null;
  source: string;
}

let memoryCache: LiveRatesState | null = null;
const listeners: Array<(state: LiveRatesState) => void> = [];

export function subscribeLiveRates(listener: (state: LiveRatesState) => void) {
  listeners.push(listener);
  if (memoryCache) listener(memoryCache);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners(state: LiveRatesState) {
  memoryCache = state;
  listeners.forEach((l) => l(state));
}

/**
 * Load cached rates from localStorage
 */
export function loadCachedRates(): LiveRatesState {
  if (memoryCache) return memoryCache;

  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveExchangeRates;
      if (parsed && parsed.rates && Object.keys(parsed.rates).length > 0) {
        const timeAgo = formatTimeAgo(parsed.timeLastUpdateUnix * 1000);
        memoryCache = {
          rates: parsed.rates,
          base: parsed.base || 'USD',
          lastUpdatedText: timeAgo,
          lastUpdatedUnix: parsed.timeLastUpdateUnix * 1000,
          isLoading: false,
          error: null,
          source: parsed.source || 'Open Exchange API',
        };
        return memoryCache;
      }
    }
  } catch (err) {
    console.error('Error loading rates from cache:', err);
  }

  memoryCache = {
    rates: {},
    base: 'USD',
    lastUpdatedText: '尚未更新',
    lastUpdatedUnix: 0,
    isLoading: false,
    error: null,
    source: '預設標準匯率',
  };
  return memoryCache;
}

/**
 * Fetch latest real-time rates from Open Exchange Rates API
 */
export async function fetchLiveRates(force = false): Promise<LiveRatesState> {
  const current = loadCachedRates();
  const now = Date.now();

  // If not forcing and cache is recent (< 4 hours), return current
  if (!force && current.lastUpdatedUnix > 0 && now - current.lastUpdatedUnix < CACHE_TTL_MS) {
    return current;
  }

  notifyListeners({ ...current, isLoading: true, error: null });

  try {
    // Primary API endpoint (Free, CORS enabled, updated regularly)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.result === 'success' && data.rates) {
      const unixMs = data.time_last_update_unix ? data.time_last_update_unix * 1000 : now;
      const cachedData: LiveExchangeRates = {
        base: data.base_code || 'USD',
        date: new Date(unixMs).toISOString(),
        timeLastUpdateUnix: Math.floor(unixMs / 1000),
        rates: data.rates,
        source: '國際即時匯率網絡 (Open Exchange Rates)',
      };

      try {
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cachedData));
      } catch (e) {
        console.warn('Unable to persist rates in localStorage', e);
      }

      const newState: LiveRatesState = {
        rates: data.rates,
        base: cachedData.base,
        lastUpdatedText: '剛才已同步最新匯率',
        lastUpdatedUnix: unixMs,
        isLoading: false,
        error: null,
        source: cachedData.source,
      };

      notifyListeners(newState);
      return newState;
    } else {
      throw new Error('Invalid rate data format');
    }
  } catch (primaryErr) {
    console.warn('Primary exchange API failed, attempting fallback...', primaryErr);

    try {
      // Secondary fallback endpoint
      const fallbackResp = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (fallbackResp.ok) {
        const fbData = await fallbackResp.json();
        if (fbData.rates) {
          const cachedData: LiveExchangeRates = {
            base: fbData.base || 'USD',
            date: new Date().toISOString(),
            timeLastUpdateUnix: Math.floor(now / 1000),
            rates: fbData.rates,
            source: '國際備援匯率服務',
          };
          localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cachedData));
          const newState: LiveRatesState = {
            rates: fbData.rates,
            base: 'USD',
            lastUpdatedText: '剛才已同步最新匯率 (備援節點)',
            lastUpdatedUnix: now,
            isLoading: false,
            error: null,
            source: cachedData.source,
          };
          notifyListeners(newState);
          return newState;
        }
      }
    } catch (fallbackErr) {
      console.error('All rate fetch attempts failed:', fallbackErr);
    }

    // Fail gracefully with current cache or fallback notice
    const failedState: LiveRatesState = {
      ...current,
      isLoading: false,
      error: '暫時無法連線至國際匯率服務，已保留離線參考匯率。',
    };
    notifyListeners(failedState);
    return failedState;
  }
}

/**
 * Get real-time conversion rate from fromCode to toCode
 * e.g. 1 JPY = ? HKD
 */
export function calculateLiveExchangeRate(fromCode: string, toCode: string): number {
  if (fromCode.toUpperCase() === toCode.toUpperCase()) return 1.0;

  const current = loadCachedRates();
  const f = fromCode.toUpperCase();
  const t = toCode.toUpperCase();

  if (current.rates && current.rates[f] && current.rates[t]) {
    // Both currencies exist in USD-based rates table
    // 1 USD = rates[f] [fromCode] => 1 [fromCode] = (1 / rates[f]) USD
    // 1 USD = rates[t] [toCode]   => 1 [fromCode] = (rates[t] / rates[f]) [toCode]
    const rate = current.rates[t] / current.rates[f];
    if (rate >= 100) return Math.round(rate * 10) / 10;
    if (rate >= 1) return Math.round(rate * 1000) / 1000;
    return Math.round(rate * 10000) / 10000;
  }

  // Fallback to static realistic defaults
  return getDefaultExchangeRate(fromCode, toCode);
}

/**
 * Format relative time ago string
 */
export function formatTimeAgo(timestampMs: number): string {
  if (!timestampMs || timestampMs <= 0) return '尚未更新';
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);

  if (diffSec < 60) return '剛才';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分鐘前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小時前`;
  const days = Math.floor(diffSec / 86400);
  return `${days} 天前`;
}
