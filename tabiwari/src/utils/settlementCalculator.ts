import { ExpenseItem, MainExpenseCategory, Participant, SettlementTransfer, Trip } from '../types';
import { EXPENSE_CATEGORIES, getCurrencyInfo } from './expenseConstants';

export interface ParticipantBalance {
  participant: Participant;
  totalPaid: number;      // How much this person actually paid out of pocket
  totalShare: number;     // How much this person consumed / was responsible for
  netBalance: number;     // totalPaid - totalShare (> 0: should receive, < 0: owes)
}

export interface CategorySummary {
  category: MainExpenseCategory;
  name: string;
  icon: string;
  colorLight: string;
  colorDark: string;
  totalAmount: number;    // Converted to baseCurrency
  percentage: number;     // 0 to 100
  count: number;
}

export interface TripExpenseSummary {
  totalExpense: number;   // In baseCurrency
  averagePerPerson: number; // In baseCurrency
  originalCurrenciesUsed: { currency: string; amount: number }[];
  categorySummaries: CategorySummary[];
  categoryTotals: Record<MainExpenseCategory, number>;
  currencyTotals: Record<string, number>;
  participantBalances: ParticipantBalance[];
  settlementTransfers: SettlementTransfer[];
}

/**
 * Format currency amount with symbol and sensible thousand-separators
 */
export function formatMoney(amount: number, currencyCode: string, decimalPlaces?: number): string {
  const curr = getCurrencyInfo(currencyCode);
  const rounded = decimalPlaces !== undefined 
    ? amount.toFixed(decimalPlaces) 
    : (amount % 1 === 0 ? amount.toLocaleString('en-US') : amount.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }));

  return `${curr.symbol} ${rounded}`;
}

/**
 * Calculate comprehensive summary for a trip
 */
export function calculateTripExpenseSummary(trip: Trip): TripExpenseSummary {
  const expenses = trip.expenses || [];
  const participants = trip.participants || [];
  const baseCurrency = trip.baseCurrency || 'HKD';

  let totalExpense = 0;
  const currencyMap: Record<string, number> = {};
  const categoryMap: Record<MainExpenseCategory, { amount: number; count: number }> = {
    stay: { amount: 0, count: 0 },
    food: { amount: 0, count: 0 },
    transport: { amount: 0, count: 0 },
    sightseeing: { amount: 0, count: 0 },
    shopping: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };

  const paidMap: Record<string, number> = {};
  const shareMap: Record<string, number> = {};

  // Initialize participant maps
  participants.forEach((p) => {
    paidMap[p.id] = 0;
    shareMap[p.id] = 0;
  });

  // Process each expense
  expenses.forEach((expense) => {
    const converted = expense.convertedAmount || (expense.amount * (expense.exchangeRate || 1));
    totalExpense += converted;

    // Track original currency sum
    const curr = expense.currency || baseCurrency;
    currencyMap[curr] = (currencyMap[curr] || 0) + expense.amount;

    // Track category
    const cat = expense.category || 'other';
    if (categoryMap[cat]) {
      categoryMap[cat].amount += converted;
      categoryMap[cat].count += 1;
    }

    // Track payer
    if (paidMap[expense.payerId] !== undefined) {
      paidMap[expense.payerId] += converted;
    } else {
      paidMap[expense.payerId] = converted;
    }

    // Track split shares
    if (expense.splitDetails && Object.keys(expense.splitDetails).length > 0) {
      Object.entries(expense.splitDetails).forEach(([pid, share]) => {
        if (shareMap[pid] !== undefined) {
          shareMap[pid] += share;
        } else {
          shareMap[pid] = share;
        }
      });
    } else if (expense.involvedParticipantIds && expense.involvedParticipantIds.length > 0) {
      const perPerson = converted / expense.involvedParticipantIds.length;
      expense.involvedParticipantIds.forEach((pid) => {
        if (shareMap[pid] !== undefined) {
          shareMap[pid] += perPerson;
        } else {
          shareMap[pid] = perPerson;
        }
      });
    } else {
      // Default to payer
      shareMap[expense.payerId] = (shareMap[expense.payerId] || 0) + converted;
    }
  });

  const categoryTotals: Record<MainExpenseCategory, number> = {
    stay: Math.round(categoryMap.stay.amount * 10) / 10,
    food: Math.round(categoryMap.food.amount * 10) / 10,
    transport: Math.round(categoryMap.transport.amount * 10) / 10,
    sightseeing: Math.round(categoryMap.sightseeing.amount * 10) / 10,
    shopping: Math.round(categoryMap.shopping.amount * 10) / 10,
    other: Math.round(categoryMap.other.amount * 10) / 10,
  };

  // Build category summaries
  const categorySummaries: CategorySummary[] = (Object.keys(categoryMap) as MainExpenseCategory[])
    .map((catKey) => {
      const meta = EXPENSE_CATEGORIES[catKey];
      const amount = categoryMap[catKey].amount;
      const count = categoryMap[catKey].count;
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        category: catKey,
        name: meta.name,
        icon: meta.icon,
        colorLight: meta.colorLight,
        colorDark: meta.colorDark,
        totalAmount: Math.round(amount * 10) / 10,
        percentage: Math.round(percentage * 10) / 10,
        count,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Build participant balances
  const participantBalances: ParticipantBalance[] = participants.map((p) => {
    const totalPaid = Math.round((paidMap[p.id] || 0) * 10) / 10;
    const totalShare = Math.round((shareMap[p.id] || 0) * 10) / 10;
    const netBalance = Math.round((totalPaid - totalShare) * 10) / 10;
    return {
      participant: p,
      totalPaid,
      totalShare,
      netBalance,
    };
  });

  // Calculate settlement transfers (minimizing transactions)
  const settlementTransfers = computeOptimalSettlements(participantBalances, baseCurrency, trip.settledTransfers || []);

  const originalCurrenciesUsed = Object.entries(currencyMap).map(([currency, amount]) => ({
    currency,
    amount: Math.round(amount * 10) / 10,
  }));

  const averagePerPerson = participants.length > 0 
    ? Math.round((totalExpense / participants.length) * 10) / 10 
    : 0;

  return {
    totalExpense: Math.round(totalExpense * 10) / 10,
    averagePerPerson,
    originalCurrenciesUsed,
    categorySummaries,
    categoryTotals,
    currencyTotals: currencyMap,
    participantBalances,
    settlementTransfers,
  };
}

/**
 * Greedy algorithm to find the minimum number of settlements between debtors and creditors
 */
function computeOptimalSettlements(
  balances: ParticipantBalance[],
  currency: string,
  settledTransferKeys: string[]
): SettlementTransfer[] {
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (!b?.participant) return;
    const name = b.participant.name || '旅伴';
    const id = b.participant.id || 'p-unknown';
    if (b.netBalance < -0.1) {
      debtors.push({ id, name, amount: -b.netBalance });
    } else if (b.netBalance > 0.1) {
      creditors.push({ id, name, amount: b.netBalance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0.1) {
      const rounded = Math.round(transferAmount * 10) / 10;
      const transferKey = `${debtor.id}_to_${creditor.id}_${Math.round(rounded)}`;
      const isSettled = settledTransferKeys.includes(transferKey);

      transfers.push({
        fromParticipantId: debtor.id,
        fromParticipantName: debtor.name,
        toParticipantId: creditor.id,
        toParticipantName: creditor.name,
        amount: rounded,
        currency,
        isSettled,
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
    }

    if (debtor.amount < 0.1) dIdx++;
    if (creditor.amount < 0.1) cIdx++;
  }

  return transfers;
}
