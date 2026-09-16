import { Trip, AppBranding, ExpenseDraft, Participant, ExpenseItem } from '../types';
import { INITIAL_TRIPS } from '../data/sampleTrips';
import { PARTICIPANT_PALETTE, getParticipantColor } from './participantUtils';
import { idbGet, idbSet } from './indexedDbStorage';

const STORAGE_KEY = 'tabiki_travel_expense_trips_v2';
const BACKUP_STORAGE_KEY = 'tabiki_trips_backup_auto_v1';
const THEME_KEY = 'tabiki_theme_mode_v1';
const ACTIVE_TRIP_KEY = 'tabiki_active_trip_id_v1';
const BRANDING_KEY = 'tabiki_app_branding_v1';
const EXPENSE_DRAFT_PREFIX = 'tabiki_draft_expense_';
const MODAL_STATE_KEY = 'tabiki_expense_modal_state_v1';

export type ThemeMode = 'light' | 'dark';

export const DEFAULT_BRANDING: AppBranding = {
  logoType: 'preset',
  presetIcon: 'compass',
  appName: '旅割',
  appSubtitle: 'TABI-WARI',
};

export function loadAppBranding(): AppBranding {
  try {
    const raw = localStorage.getItem(BRANDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.appName) {
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to load branding:', err);
  }
  return DEFAULT_BRANDING;
}

export function saveAppBranding(branding: AppBranding): void {
  try {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
  } catch (err) {
    console.error('Failed to save branding:', err);
  }
}

export function loadActiveTripId(): string | null {
  try {
    // Check URL hash first (e.g. #trip-1)
    if (window.location.hash.startsWith('#trip-')) {
      const hashId = window.location.hash.replace('#', '');
      return hashId;
    }
    const saved = localStorage.getItem(ACTIVE_TRIP_KEY);
    if (saved && saved !== 'null') return saved;
  } catch (err) {
    console.error('Failed to load active trip ID:', err);
  }
  return null;
}

export function saveActiveTripId(tripId: string | null): void {
  try {
    if (tripId) {
      localStorage.setItem(ACTIVE_TRIP_KEY, tripId);
      window.location.hash = tripId;
    } else {
      localStorage.removeItem(ACTIVE_TRIP_KEY);
      if (window.location.hash.startsWith('#trip-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  } catch (err) {
    console.error('Failed to save active trip ID:', err);
  }
}

export function clearActiveTripId(): void {
  try {
    localStorage.removeItem(ACTIVE_TRIP_KEY);
    if (window.location.hash.startsWith('#trip-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (err) {
    console.error('Failed to clear active trip ID:', err);
  }
}

export function loadActiveTab(tripId: string): string {
  try {
    const tab = localStorage.getItem(`tabiki_active_tab_${tripId}`);
    if (tab) return tab;
  } catch (e) {
    // ignore
  }
  return 'expenses';
}

export function saveActiveTab(tripId: string, tab: string): void {
  try {
    localStorage.setItem(`tabiki_active_tab_${tripId}`, tab);
  } catch (e) {
    // ignore
  }
}

export function loadExpenseDraft(tripId: string): ExpenseDraft | null {
  try {
    const raw = localStorage.getItem(`${EXPENSE_DRAFT_PREFIX}${tripId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ExpenseDraft;
      if (parsed && parsed.tripId === tripId && parsed.data) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load expense draft:', err);
  }
  return null;
}

export function saveExpenseDraft(draft: ExpenseDraft): void {
  try {
    localStorage.setItem(`${EXPENSE_DRAFT_PREFIX}${draft.tripId}`, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save expense draft:', err);
  }
}

export function clearExpenseDraft(tripId: string): void {
  try {
    localStorage.removeItem(`${EXPENSE_DRAFT_PREFIX}${tripId}`);
  } catch (err) {
    console.error('Failed to clear expense draft:', err);
  }
}

export function saveExpenseModalState(isOpen: boolean, editingExpenseId: string | null = null): void {
  try {
    if (isOpen) {
      localStorage.setItem(MODAL_STATE_KEY, JSON.stringify({ isOpen: true, editingExpenseId }));
    } else {
      localStorage.removeItem(MODAL_STATE_KEY);
    }
  } catch (e) {
    // ignore
  }
}

export function loadExpenseModalState(): { isOpen: boolean; editingExpenseId: string | null } {
  try {
    const raw = localStorage.getItem(MODAL_STATE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return { isOpen: false, editingExpenseId: null };
}

export function loadTheme(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem('tabi_wari_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (err) {
    console.error('Failed to load theme:', err);
  }
  return null;
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem('tabi_wari_theme', theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

/**
 * Thoroughly sanitize a single trip object to guarantee no undefined fields can ever cause a crash
 */
export function sanitizeTrip(rawTrip: any, idx = 0): Trip {
  if (!rawTrip || typeof rawTrip !== 'object') {
    return {
      id: `trip-fallback-${Date.now()}-${idx}`,
      title: '我的旅行記帳',
      subtitle: '',
      destination: '東京',
      country: '日本',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      season: 'spring',
      status: 'ongoing',
      baseCurrency: 'HKD',
      budget: 0,
      coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
      participants: [{ id: 'p-default', name: '我', avatarColor: '#4A7C59', isCurrentUser: true }],
      expenses: [],
      packingItems: [],
      memos: [],
      settledTransfers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const baseCurrency = rawTrip.baseCurrency || 'HKD';

  // Sanitize participants
  let participants: Participant[] = [];
  if (Array.isArray(rawTrip.participants) && rawTrip.participants.length > 0) {
    participants = rawTrip.participants.map((p: any, pIdx: number) => {
      const id = p?.id ? String(p.id) : `p-${pIdx + 1}`;
      const name = p?.name && String(p.name).trim() ? String(p.name).trim() : `成員 ${pIdx + 1}`;
      const avatarColor = p?.avatarColor || PARTICIPANT_PALETTE[pIdx % PARTICIPANT_PALETTE.length];
      return {
        id,
        name,
        avatarColor,
        isCurrentUser: !!p?.isCurrentUser,
      };
    });
  } else {
    participants = [
      { id: 'p-default', name: '我', avatarColor: '#4A7C59', isCurrentUser: true }
    ];
  }

  const validParticipantIds = new Set(participants.map((p) => p.id));
  const fallbackPayerId = participants[0].id;

  // Sanitize expenses
  const rawExpenses = Array.isArray(rawTrip.expenses) ? rawTrip.expenses : [];
  const expenses: ExpenseItem[] = rawExpenses.map((exp: any, eIdx: number) => {
    const amount = typeof exp?.amount === 'number' && !isNaN(exp.amount) ? Math.max(0, exp.amount) : 0;
    const exchangeRate = typeof exp?.exchangeRate === 'number' && exp.exchangeRate > 0 ? exp.exchangeRate : 1;
    const convertedAmount = typeof exp?.convertedAmount === 'number' && !isNaN(exp.convertedAmount) 
      ? exp.convertedAmount 
      : Math.round(amount * exchangeRate * 10) / 10;

    const payerId = validParticipantIds.has(exp?.payerId) ? exp.payerId : fallbackPayerId;

    let involved = Array.isArray(exp?.involvedParticipantIds) 
      ? exp.involvedParticipantIds.filter((pid: string) => validParticipantIds.has(pid))
      : [];
    if (involved.length === 0) {
      involved = Array.from(validParticipantIds);
    }

    return {
      id: exp?.id ? String(exp.id) : `exp-${Date.now()}-${eIdx}`,
      title: exp?.title && String(exp.title).trim() ? String(exp.title).trim() : '消費項目',
      amount,
      currency: exp?.currency || baseCurrency,
      exchangeRate,
      convertedAmount,
      category: exp?.category || 'other',
      subcategory: exp?.subcategory || '',
      payerId,
      splitType: exp?.splitType || 'equal',
      involvedParticipantIds: involved,
      splitDetails: exp?.splitDetails || {},
      date: exp?.date || rawTrip.startDate || new Date().toISOString().split('T')[0],
      time: exp?.time || '12:00',
      location: exp?.location || '',
      notes: exp?.notes || '',
      paymentMethod: exp?.paymentMethod || 'cash',
      receiptPhoto: exp?.receiptPhoto || undefined,
    };
  });

  return {
    id: rawTrip.id ? String(rawTrip.id) : `trip-${Date.now()}-${idx}`,
    title: rawTrip.title && String(rawTrip.title).trim() ? String(rawTrip.title).trim() : '日本旅行記帳',
    subtitle: rawTrip.subtitle ? String(rawTrip.subtitle) : '',
    destination: rawTrip.destination && String(rawTrip.destination).trim() ? String(rawTrip.destination).trim() : '東京',
    country: rawTrip.country || '日本',
    startDate: rawTrip.startDate || new Date().toISOString().split('T')[0],
    endDate: rawTrip.endDate || new Date().toISOString().split('T')[0],
    season: ['spring', 'summer', 'autumn', 'winter'].includes(rawTrip.season) ? rawTrip.season : 'spring',
    status: ['ongoing', 'completed', 'planning'].includes(rawTrip.status) ? rawTrip.status : 'ongoing',
    baseCurrency,
    budget: typeof rawTrip.budget === 'number' && !isNaN(rawTrip.budget) ? rawTrip.budget : 0,
    coverImage: rawTrip.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
    participants,
    expenses,
    packingItems: Array.isArray(rawTrip.packingItems) ? rawTrip.packingItems : (Array.isArray(rawTrip.packings) ? rawTrip.packings : []),
    memos: Array.isArray(rawTrip.memos) ? rawTrip.memos : [],
    settledTransfers: Array.isArray(rawTrip.settledTransfers) ? rawTrip.settledTransfers : [],
    createdAt: rawTrip.createdAt || new Date().toISOString(),
    updatedAt: rawTrip.updatedAt || new Date().toISOString(),
  };
}

export function loadTrips(): Trip[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    
    // Check backup snapshot if primary key is absent or empty
    if (!raw) {
      raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    }
    // Check v1 key migration
    if (!raw) {
      raw = localStorage.getItem('tabiki_travel_expense_trips_v1');
    }

    let tripList: Trip[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tripList = parsed.map((t, i) => sanitizeTrip(t, i));
        }
      } catch (parseErr) {
        console.warn('Primary storage parse error, checking backup:', parseErr);
        const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
        if (backupRaw) {
          const parsedBackup = JSON.parse(backupRaw);
          if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
            tripList = parsedBackup.map((t, i) => sanitizeTrip(t, i));
          }
        }
      }
    }

    if (tripList.length === 0) {
      // If truly no data, initialize with sample trips
      const sanitizedSamples = INITIAL_TRIPS.map((t, i) => sanitizeTrip(t, i));
      saveTrips(sanitizedSamples);
      return sanitizedSamples;
    }

    return tripList;
  } catch (err) {
    console.error('Failed to load trips from storage:', err);
    return INITIAL_TRIPS.map((t, i) => sanitizeTrip(t, i));
  }
}

/**
 * Asynchronously checks and restores trips from IndexedDB if localStorage was cleared
 */
export async function syncFromIndexedDbIfEmpty(): Promise<Trip[] | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === '[]') {
      const idbTrips = await idbGet<Trip[]>('trips');
      if (Array.isArray(idbTrips) && idbTrips.length > 0) {
        console.info('[Storage] Restored trips from IndexedDB backup:', idbTrips.length);
        const sanitized = idbTrips.map((t, i) => sanitizeTrip(t, i));
        saveTrips(sanitized);
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('[Storage] Error checking IndexedDB:', e);
  }
  return null;
}

export function saveTrips(trips: Trip[]): void {
  try {
    const sanitized = trips.map((t, i) => sanitizeTrip(t, i));
    const jsonStr = JSON.stringify(sanitized);

    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
      // Secondary backup snapshot
      localStorage.setItem(BACKUP_STORAGE_KEY, jsonStr);
    } catch (quotaErr) {
      console.warn('[Storage] LocalStorage quota exceeded, stripping large photos to protect financial data:', quotaErr);
      // Strip large photos so financial numbers and trips are NEVER lost
      const lightTrips = sanitized.map((trip) => ({
        ...trip,
        coverImage: trip.coverImage?.startsWith('data:') ? '' : trip.coverImage,
        expenses: trip.expenses.map((exp) => ({
          ...exp,
          receiptPhoto: undefined, // Strip photos to fit quota
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightTrips));
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(lightTrips));
    }

    // Always mirror full copy asynchronously to limitless IndexedDB
    idbSet('trips', sanitized).catch((e) => console.warn('[Storage] IndexedDB sync error:', e));

    // Dispatch global auto-save event for instant UI feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tabiki-autosaved', {
        detail: { count: sanitized.length, timestamp: Date.now() }
      }));
    }
  } catch (err) {
    console.error('Failed to save trips to storage:', err);
  }
}

export function resetToSampleTrips(): Trip[] {
  const sanitized = INITIAL_TRIPS.map((t, i) => sanitizeTrip(t, i));
  saveTrips(sanitized);
  return sanitized;
}

export async function exportTripsAsJSON(trips: Trip[]): Promise<{ method: 'share' | 'download'; filename: string }> {
  const sanitized = trips.map((t, i) => sanitizeTrip(t, i));
  const jsonString = JSON.stringify(sanitized, null, 2);
  const now = new Date().toISOString().split('T')[0];
  const filename = `tabiki-travel-backup-${now}.json`;

  const blob = new Blob([jsonString], { type: 'application/json' });

  // 1. If iPhone / Mobile supports Web Share API with files, trigger native iOS Share Sheet
  // This lets user directly choose "Save to Files", AirDrop, WhatsApp, Notes, etc.
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '旅割旅行記帳備份',
          text: `旅割旅行記帳備份檔案 (${now})`,
        });
        return { method: 'share', filename };
      }
    } catch (err: any) {
      // If user cancelled share sheet (AbortError), don't trigger fallback download
      if (err?.name === 'AbortError') {
        return { method: 'share', filename };
      }
      console.warn('Native share failed, falling back to blob download:', err);
    }
  }

  // 2. Fallback to standard Blob URL download
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', filename);
  downloadAnchor.style.display = 'none';
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => {
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }, 1000);

  return { method: 'download', filename };
}

export function calculateDaysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 1;
  const diffDays = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function formatDateRange(start: string, end: string): string {
  if (!start && !end) return '';
  if (start && !end) return start.replace(/-/g, '.');
  const s = start.replace(/-/g, '.');
  const e = end.replace(/-/g, '.');
  const days = calculateDaysBetween(start, end);
  return `${s} ~ ${e} · ${days}天`;
}

/**
 * Compresses an image file on the client using HTML5 Canvas.
 * Reduces 5MB-10MB mobile camera photos down to ~50KB-90KB JPEG.
 * This ensures localStorage quota is never exceeded!
 */
export function compressImageFile(file: File, maxWidth = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image or SVG, read directly
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size < 50 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToBase64(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return compressImageFile(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
