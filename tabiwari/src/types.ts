export type TripSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type MainExpenseCategory = 
  | 'stay'          // 住宿
  | 'food'          // 餐飲
  | 'transport'     // 交通
  | 'sightseeing'   // 玩樂門票
  | 'shopping'      // 購物手信
  | 'other';        // 通訊其他

export type PaymentMethod = 'cash' | 'credit_card' | 'ic_card' | 'mobile_pay';

export type SplitType = 'equal' | 'custom' | 'personal';

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  isCurrentUser?: boolean;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: MainExpenseCategory;
  subcategory: string;
  amount: number;             // Original amount in the chosen currency
  currency: string;           // e.g., 'JPY', 'HKD', 'TWD', 'USD', 'EUR', 'KRW', 'THB', 'GBP'
  exchangeRate: number;       // Rate to baseCurrency: 1 [currency] = [exchangeRate] [baseCurrency]
  convertedAmount: number;    // amount * exchangeRate (in baseCurrency)
  date: string;               // YYYY-MM-DD
  time?: string;              // HH:mm
  payerId: string;            // Participant who paid
  splitType: SplitType;       // 'equal', 'custom', or 'personal'
  involvedParticipantIds: string[]; // Participants participating in this expense
  splitDetails: Record<string, number>; // participantId -> amount owed in baseCurrency
  paymentMethod: PaymentMethod;
  location?: string;
  notes?: string;
  receiptPhoto?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SettlementTransfer {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
  currency: string;
  isSettled?: boolean;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRateToHKD: number;
  defaultRateToJPY: number;
  defaultRateToUSD: number;
  defaultRateToTWD: number;
}

export interface PackingItem {
  id: string;
  category: 'essential' | 'clothing' | 'electronics' | 'medicine' | 'personal' | 'other';
  name: string;
  packed: boolean;
}

export interface TripMemo {
  id: string;
  title: string;
  content: string;
  category?: 'booking' | 'tax_free' | 'note' | 'wifi';
  updatedAt?: string;
}

export interface AppBranding {
  logoType: 'preset' | 'image' | 'emoji';
  presetIcon: string;
  customImageUrl?: string;
  customEmoji?: string;
  appName: string;
  appSubtitle: string;
  iconBgColor?: string;
  imageFit?: 'cover' | 'contain';
}

export interface LiveExchangeRates {
  base: string;
  date: string;
  timeLastUpdateUnix: number;
  rates: Record<string, number>;
  source: string;
}

export interface ExpenseDraft {
  tripId: string;
  editingExpenseId: string | null;
  data: Partial<ExpenseItem>;
  savedAt: string;
}

export interface Trip {
  id: string;
  title: string;
  subtitle?: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  status: TripStatus;
  season: TripSeason;
  baseCurrency: string;       // Default trip currency (e.g. 'HKD' or 'JPY')
  budget?: number;            // Total budget in baseCurrency
  moodTag?: string;
  participants: Participant[];
  expenses: ExpenseItem[];
  settledTransfers?: string[]; // Array of unique keys for transfers marked as paid
  packingItems?: PackingItem[];
  packingList?: PackingItem[];
  memos?: TripMemo[];
  createdAt: string;
  updatedAt: string;
}
