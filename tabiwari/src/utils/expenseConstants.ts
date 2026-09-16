import { CurrencyOption, MainExpenseCategory, PaymentMethod } from '../types';

export const POPULAR_CURRENCIES: CurrencyOption[] = [
  {
    code: 'HKD',
    name: '港幣',
    symbol: 'HK$',
    flag: '🇭🇰',
    defaultRateToHKD: 1.0,
    defaultRateToJPY: 19.5,
    defaultRateToUSD: 0.128,
    defaultRateToTWD: 4.1,
  },
  {
    code: 'JPY',
    name: '日圓',
    symbol: '¥',
    flag: '🇯🇵',
    defaultRateToHKD: 0.051,
    defaultRateToJPY: 1.0,
    defaultRateToUSD: 0.0066,
    defaultRateToTWD: 0.21,
  },
  {
    code: 'TWD',
    name: '新台幣',
    symbol: 'NT$',
    flag: '🇹🇼',
    defaultRateToHKD: 0.244,
    defaultRateToJPY: 4.76,
    defaultRateToUSD: 0.031,
    defaultRateToTWD: 1.0,
  },
  {
    code: 'USD',
    name: '美元',
    symbol: '$',
    flag: '🇺🇸',
    defaultRateToHKD: 7.82,
    defaultRateToJPY: 152.5,
    defaultRateToUSD: 1.0,
    defaultRateToTWD: 32.1,
  },
  {
    code: 'EUR',
    name: '歐元',
    symbol: '€',
    flag: '🇪🇺',
    defaultRateToHKD: 8.45,
    defaultRateToJPY: 164.8,
    defaultRateToUSD: 1.08,
    defaultRateToTWD: 34.6,
  },
  {
    code: 'GBP',
    name: '英鎊',
    symbol: '£',
    flag: '🇬🇧',
    defaultRateToHKD: 10.15,
    defaultRateToJPY: 198.2,
    defaultRateToUSD: 1.30,
    defaultRateToTWD: 41.6,
  },
  {
    code: 'KRW',
    name: '韓圓',
    symbol: '₩',
    flag: '🇰🇷',
    defaultRateToHKD: 0.0058,
    defaultRateToJPY: 0.113,
    defaultRateToUSD: 0.00074,
    defaultRateToTWD: 0.024,
  },
  {
    code: 'THB',
    name: '泰銖',
    symbol: '฿',
    flag: '🇹🇭',
    defaultRateToHKD: 0.228,
    defaultRateToJPY: 4.45,
    defaultRateToUSD: 0.029,
    defaultRateToTWD: 0.93,
  },
  {
    code: 'SGD',
    name: '新加坡幣',
    symbol: 'S$',
    flag: '🇸🇬',
    defaultRateToHKD: 5.92,
    defaultRateToJPY: 115.4,
    defaultRateToUSD: 0.757,
    defaultRateToTWD: 24.3,
  },
  {
    code: 'AUD',
    name: '澳元',
    symbol: 'A$',
    flag: '🇦🇺',
    defaultRateToHKD: 5.15,
    defaultRateToJPY: 100.5,
    defaultRateToUSD: 0.658,
    defaultRateToTWD: 21.1,
  },
  {
    code: 'CNY',
    name: '人民幣',
    symbol: '¥',
    flag: '🇨🇳',
    defaultRateToHKD: 1.08,
    defaultRateToJPY: 21.1,
    defaultRateToUSD: 0.138,
    defaultRateToTWD: 4.43,
  },
  {
    code: 'CAD',
    name: '加元',
    symbol: 'C$',
    flag: '🇨🇦',
    defaultRateToHKD: 5.75,
    defaultRateToJPY: 112.2,
    defaultRateToUSD: 0.735,
    defaultRateToTWD: 23.6,
  },
];

export function getCurrencyInfo(code: string): CurrencyOption {
  const found = POPULAR_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (found) return found;
  return {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    symbol: code.toUpperCase(),
    flag: '🌐',
    defaultRateToHKD: 1.0,
    defaultRateToJPY: 19.5,
    defaultRateToUSD: 0.13,
    defaultRateToTWD: 4.1,
  };
}

/**
 * Calculate estimated default exchange rate: 1 unit of fromCurrency = ? units of toCurrency
 */
export function getDefaultExchangeRate(fromCode: string, toCode: string): number {
  if (fromCode.toUpperCase() === toCode.toUpperCase()) return 1.0;
  
  const from = getCurrencyInfo(fromCode);
  const to = getCurrencyInfo(toCode);

  // Use HKD as bridge
  const fromToHKD = from.defaultRateToHKD;
  const toToHKD = to.defaultRateToHKD;

  if (toToHKD === 0) return 1.0;
  const calculated = fromToHKD / toToHKD;
  // Round sensibly
  if (calculated >= 100) return Math.round(calculated * 10) / 10;
  if (calculated >= 1) return Math.round(calculated * 1000) / 1000;
  return Math.round(calculated * 10000) / 10000;
}

export interface CategoryMeta {
  key: MainExpenseCategory;
  name: string;
  japanese: string;
  icon: string;
  colorLight: string;
  colorDark: string;
  bgColorLight: string;
  bgColorDark: string;
  borderColorLight: string;
  subcategories: string[];
}

export const EXPENSE_CATEGORIES: Record<MainExpenseCategory, CategoryMeta> = {
  stay: {
    key: 'stay',
    name: '住宿費用',
    japanese: '宿泊費',
    icon: '🏨',
    colorLight: '#8C6E54', // Hinoki Wood
    colorDark: '#D4A373',
    bgColorLight: '#FAF5EE',
    bgColorDark: '#2F261F',
    borderColorLight: '#EFE5D8',
    subcategories: [
      '酒店房費',
      '溫泉旅館 (含早晚餐)',
      '民宿 / Airbnb',
      '青年旅館 / 膠囊',
      '城市稅 / 溫泉入湯稅',
      '提早入住 / 延遲退房費',
    ],
  },
  food: {
    key: 'food',
    name: '餐飲美食',
    japanese: '飲食代',
    icon: '🍜',
    colorLight: '#C86D51', // Warm Terracotta
    colorDark: '#E07A5F',
    bgColorLight: '#FCF3F0',
    bgColorDark: '#352520',
    borderColorLight: '#F5DDD6',
    subcategories: [
      '正餐料理 (午餐/晚餐)',
      '拉麵 / 烏冬定食',
      '居酒屋 / 燒肉放題',
      '咖啡店 / 喫茶店 / 甜品',
      '便利店補給 (朝食/宵夜)',
      '街頭小食 / 季節水果飲品',
    ],
  },
  transport: {
    key: 'transport',
    name: '交通車費',
    japanese: '交通費',
    icon: '🚅',
    colorLight: '#4B7B94', // Muted Indigo Blue
    colorDark: '#6BA4C4',
    bgColorLight: '#F1F7FA',
    bgColorDark: '#202B33',
    borderColorLight: '#DBECF5',
    subcategories: [
      '國際來回機票',
      '新幹線 / JR特急車票',
      '火車費 / 渡輪費',
      '地鐵 / 私鐵 / 交通IC卡加值',
      '巴士 / 觀光周遊券',
      '的士 / Uber叫車',
      '租車 / 租賃費',
      '油費 / 泊車費 / 高速公路過路費',
    ],
  },
  sightseeing: {
    key: 'sightseeing',
    name: '玩樂門票',
    japanese: '観光・体験',
    icon: '🎟️',
    colorLight: '#628B6A', // Bamboo Matcha Green
    colorDark: '#81B29A',
    bgColorLight: '#F1F7F3',
    bgColorDark: '#202E24',
    borderColorLight: '#D9ECE0',
    subcategories: [
      '景點入場券 / 寺社拜觀料',
      '主題樂園 (迪士尼/環球影城等)',
      '日歸溫泉 / 錢湯浴場',
      '文化體驗 (和服/茶道/陶藝)',
      '展覽 / 美術館 / 觀景台門票',
      '導賞團 / 船票 / 纜車票',
    ],
  },
  shopping: {
    key: 'shopping',
    name: '購物手信',
    japanese: 'お買い物',
    icon: '🛍️',
    colorLight: '#B06B8A', // Muted Plum Blossom
    colorDark: '#CE82A5',
    bgColorLight: '#FAF1F5',
    bgColorDark: '#33212A',
    borderColorLight: '#F3DBE6',
    subcategories: [
      '伴手禮 / 特產名菓 (お土産)',
      '藥妝 / 護膚保養品',
      '服飾 / 潮流古着 / 飾品',
      '生活選物 / 文具雜貨',
      '免稅電器 / 數碼配件',
      '紀念品 / 扭蛋 / 御守',
    ],
  },
  other: {
    key: 'other',
    name: '通訊其他',
    japanese: 'その他',
    icon: '📱',
    colorLight: '#7A7269', // Muted Pebble Grey
    colorDark: '#A89F95',
    bgColorLight: '#F6F5F2',
    bgColorDark: '#282522',
    borderColorLight: '#E6E3DE',
    subcategories: [
      '上網SIM卡 / eSIM / WiFi蛋',
      '旅遊平安保險',
      '行李托運 / 寄送 / 置物櫃 (Coin Locker)',
      '外幣找換 / 手續費',
      '簽證 / 證件辦理',
      '其他雜項 / 突發應急',
    ],
  },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string; japanese: string }> = {
  cash: { label: '現金', icon: '💴', japanese: '現金' },
  credit_card: { label: '信用卡', icon: '💳', japanese: 'クレジットカード' },
  ic_card: { label: 'IC交通卡 (Suica/八達通)', icon: '🚃', japanese: '交通系IC' },
  mobile_pay: { label: '電子支付 (PayPay/Apple Pay)', icon: '📱', japanese: 'QR・スマホ決済' },
};

export const AVATAR_PALETTES = [
  { bg: '#8C6E54', text: '#FFFFFF', name: '檜木棕' },
  { bg: '#6A8D73', text: '#FFFFFF', name: '抹茶綠' },
  { bg: '#C86D51', text: '#FFFFFF', name: '赤陶紅' },
  { bg: '#4B7B94', text: '#FFFFFF', name: '藍染青' },
  { bg: '#B06B8A', text: '#FFFFFF', name: '櫻梅紫' },
  { bg: '#C28B38', text: '#FFFFFF', name: '山吹金' },
  { bg: '#5A6B7C', text: '#FFFFFF', name: '深藍灰' },
  { bg: '#7D7461', text: '#FFFFFF', name: '利休茶' },
];
