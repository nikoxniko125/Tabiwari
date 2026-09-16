import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ArrowRightLeft, Sparkles, TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { POPULAR_CURRENCIES, getCurrencyInfo } from '../utils/expenseConstants';
import { fetchLiveRates, loadCachedRates, calculateLiveExchangeRate, subscribeLiveRates, LiveRatesState } from '../utils/exchangeRateService';

interface LiveRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: string;
  onSelectRate?: (currencyCode: string, rate: number) => void;
  isDark?: boolean;
}

export const LiveRateModal: React.FC<LiveRateModalProps> = ({
  isOpen,
  onClose,
  baseCurrency = 'HKD',
  onSelectRate,
  isDark = false,
}) => {
  const [ratesState, setRatesState] = useState<LiveRatesState>(() => loadCachedRates());
  const [targetBase, setTargetBase] = useState<string>(baseCurrency);
  const [calcAmount, setCalcAmount] = useState<string>('10000');
  const [calcFrom, setCalcFrom] = useState<string>('JPY');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Subscribe to rate updates
    const unsubscribe = subscribeLiveRates((state) => {
      setRatesState(state);
    });
    // Check and fetch if needed
    fetchLiveRates(false);
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (baseCurrency) {
      setTargetBase(baseCurrency);
    }
  }, [baseCurrency]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    await fetchLiveRates(true);
  };

  const parsedCalcAmount = parseFloat(calcAmount) || 0;
  const convertedCalc = Math.round(parsedCalcAmount * calculateLiveExchangeRate(calcFrom, targetBase) * 100) / 100;

  const baseInfo = getCurrencyInfo(targetBase);

  return (
    <div
      id="live-rate-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="live-rate-modal-dialog"
        className={`w-full max-w-2xl rounded-3xl border shadow-xl overflow-hidden my-6 transition-all ${
          isDark
            ? 'bg-[#23201D] border-[#3C352E] text-[#EDE7DF]'
            : 'bg-[#FAF8F3] border-[#E8E1D5] text-[#2C2622]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#38322B] bg-[#2A2521]' : 'border-[#EBE4D8] bg-[#F4EFE6]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#3A332C] text-[#D4A373]' : 'bg-[#EAE0D0] text-[#8C6E54]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-mincho font-semibold">
                即時外匯市場看板
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                國際外匯即時換算 · 支援隨時手動重新同步
              </p>
            </div>
          </div>
          <button
            id="live-rate-modal-close-btn"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark
                ? 'text-[#9E9488] hover:bg-[#352F28] hover:text-[#EDE7DF]'
                : 'text-[#7D756C] hover:bg-[#EAE0D0] hover:text-[#2C2622]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Status & Sync Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-white border-[#EAE3D8]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373] shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">狀態：</span>
                  <span className="text-[#3B6638] dark:text-[#81B29A] font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    即時匯率服務已連接
                  </span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#847C74]'}`}>
                  數據來源：{ratesState.source} · 更新時間：{ratesState.lastUpdatedText}
                </div>
              </div>
            </div>

            <button
              id="live-rate-refresh-btn"
              onClick={handleRefresh}
              disabled={ratesState.isLoading}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                ratesState.isLoading
                  ? 'opacity-60 cursor-not-allowed'
                  : isDark
                  ? 'bg-[#352E27] border-[#4A3F33] text-[#EDE7DF] hover:bg-[#403830]'
                  : 'bg-[#FAF6F0] border-[#DDD3C5] text-[#4A423A] hover:bg-[#F2EAE0]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ratesState.isLoading ? 'animate-spin' : ''}`} />
              <span>{ratesState.isLoading ? '正在更新最新匯率...' : '立即重新同步匯率'}</span>
            </button>
          </div>

          {/* Quick Conversion Calculator Card */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#27231F] border-[#3D352D]' : 'bg-[#FAF5EE] border-[#EAE0D0]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                旅行換算即時試算器
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  基準幣別：
                </span>
                <select
                  value={targetBase}
                  onChange={(e) => setTargetBase(e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border focus:outline-none ${
                    isDark
                      ? 'bg-[#1E1B19] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDark ? 'bg-[#1E1B19] border-[#38312A]' : 'bg-white border-[#E8DFC0]'
                }`}
              >
                <select
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-[#FAF6F0] border-[#DDD5C7] text-[#2C2622]'
                  }`}
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="輸入外幣金額"
                  className={`w-full text-right font-mono font-bold text-sm px-2 py-1 focus:outline-none bg-transparent ${
                    isDark ? 'text-[#EDE7DF]' : 'text-[#2C2622]'
                  }`}
                />
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#1E1B19] border-[#38312A]' : 'bg-white border-[#E8DFC0]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span>{baseInfo.flag}</span>
                  <span>{targetBase} 折算約</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-[#8C6E54] dark:text-[#D4A373]">
                    {baseInfo.symbol} {convertedCalc.toLocaleString()}
                  </span>
                  <div className={`text-[10px] ${isDark ? 'text-[#8C8379]' : 'text-[#968E86]'}`}>
                    1 {calcFrom} ≈ {calculateLiveExchangeRate(calcFrom, targetBase)} {targetBase}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Currencies Grid Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold">
                熱門旅行幣別即時對照表 (相對於 1 單位外幣 ＝ ? {targetBase})
              </h4>
              <span className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#847C74]'}`}>
                點擊幣別可快速套用
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {POPULAR_CURRENCIES.filter((c) => c.code !== targetBase).map((c) => {
                const rate = calculateLiveExchangeRate(c.code, targetBase);
                const isSelected = copiedCode === c.code;

                return (
                  <div
                    key={c.code}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? isDark
                          ? 'bg-[#382F24] border-[#D4A373]'
                          : 'bg-[#FAF0E1] border-[#8C6E54]'
                        : isDark
                        ? 'bg-[#2A2521] border-[#38312A] hover:border-[#4E4438]'
                        : 'bg-white border-[#EAE3D8] hover:border-[#D5C9B8]'
                    }`}
                    onClick={() => {
                      if (onSelectRate) {
                        onSelectRate(c.code, rate);
                      }
                      setCalcFrom(c.code);
                      setCopiedCode(c.code);
                      setTimeout(() => setCopiedCode(null), 1500);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{c.flag}</span>
                      <div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1">
                          <span>{c.code}</span>
                          <span className={`text-[11px] font-normal ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                            ({c.name})
                          </span>
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-[#847A6E]' : 'text-[#9E9488]'}`}>
                          1 {c.code}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#8C6E54] dark:text-[#D4A373]">
                        {rate >= 1 ? rate.toFixed(3) : rate.toFixed(4)}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-[#9E9488]' : 'text-[#847C74]'}`}>
                        {targetBase}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`pt-3 border-t flex items-center justify-between ${
              isDark ? 'border-[#38322B]' : 'border-[#EAE3D8]'
            }`}
          >
            <p className={`text-[11px] ${isDark ? 'text-[#8C8379]' : 'text-[#968E86]'}`}>
              💡 記帳時選擇外幣，系統會自動預載此即時匯率，您亦可依信用卡實際換算隨時手動微調。
            </p>
            <button
              id="live-rate-modal-done-btn"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              完成關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
