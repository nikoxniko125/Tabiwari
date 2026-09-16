import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Trip } from '../types';
import { exportTripsAsJSON, resetToSampleTrips, sanitizeTrip } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onImportSuccess: (importedTrips: Trip[]) => void;
  onResetSuccess: (sampleTrips: Trip[]) => void;
  isDark?: boolean;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  trips,
  onImportSuccess,
  onResetSuccess,
  isDark = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportTripsAsJSON(trips);
      if (result.method === 'share') {
        setFeedback({
          type: 'success',
          message: `已開啟 iPhone 分享選單！你可直接點「儲存到檔案」或透過 AirDrop/WhatsApp 備份。`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `已匯出 ${result.filename}！請查看 iPhone「檔案」App 內的「下載項目」。`,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  const processImportData = (parsed: any) => {
    let list: any[] = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.trips)) {
        list = parsed.trips;
      } else if (Array.isArray(parsed.data)) {
        list = parsed.data;
      } else if (parsed.title || parsed.id) {
        // Single trip object exported
        list = [parsed];
      }
    }

    if (list.length > 0 && (list[0].title || list[0].id || list[0].destination || list[0].expenses)) {
      const sanitized = list.map((t, i) => sanitizeTrip(t, i));
      onImportSuccess(sanitized);
      setFeedback({
        type: 'success',
        message: `成功匯入 ${sanitized.length} 趟旅行記帳資料！所有帳目已完整恢復。`,
      });
      setShowPasteBox(false);
      setPasteJsonText('');
      return true;
    } else {
      setFeedback({
        type: 'error',
        message: '檔案內容不符合記帳格式，請確認選擇了正確的旅割備份檔案。',
      });
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        processImportData(parsed);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `檔案解析失敗：請確認是標準的 JSON 檔案（${err?.message || '格式錯誤'}）。`,
        });
      }
    };
    reader.onerror = () => {
      setFeedback({
        type: 'error',
        message: '讀取檔案時發生錯誤，請重試或改用「貼上文字」匯入。',
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteJsonText.trim()) {
      setFeedback({ type: 'error', message: '請先貼上 JSON 備份文字內容。' });
      return;
    }
    try {
      const parsed = JSON.parse(pasteJsonText.trim());
      processImportData(parsed);
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: '文字並非有效 JSON 格式，請確認複製完整內容。',
      });
    }
  };

  const handleReset = () => {
    if (confirm('確定要載入預設記帳示範旅程（東京賞櫻4人行、京都宇治秋楓）嗎？這將覆蓋現有資料。')) {
      const resetData = resetToSampleTrips();
      onResetSuccess(resetData);
      setFeedback({
        type: 'success',
        message: '已重置為精選旅行分帳示範資料。',
      });
    }
  };

  return (
    <div
      id="backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="backup-modal-dialog"
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
          <h3 className="text-base font-mincho font-semibold">
            記帳資料備份與管理
          </h3>
          <button
            id="backup-modal-close-btn"
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

        <div className="p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? isDark
                    ? 'bg-[#1E2E23] text-[#81B29A] border border-[#2B4633]'
                    : 'bg-[#EEF4EC] text-[#3B6638] border border-[#D3E5CF]'
                  : isDark
                  ? 'bg-[#352020] text-[#E07A5F] border border-[#4E2B2B]'
                  : 'bg-[#FDF2F2] text-[#B84E4E] border border-[#F5D2D2]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A09689]' : 'text-[#746C65]'}`}>
            你在「旅割」中記錄的所有旅行花銷、多幣換算明細、同行旅伴與分帳結算方案，皆完整保存在瀏覽器本地。隨時可下載獨立 JSON 備份檔案，換手機或電腦時可無痛匯入恢復。
          </p>

          {/* Segmented Tab: Export vs Import */}
          <div className={`p-1 rounded-2xl border flex ${
            isDark ? 'bg-[#1E1C1A] border-[#38312A]' : 'bg-[#F2ECE1] border-[#E2D8C7]'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'import'
                  ? isDark
                    ? 'bg-[#352E27] text-[#D4A373] shadow-xs'
                    : 'bg-white text-[#2C2622] shadow-xs'
                  : isDark
                  ? 'text-[#9E9488] hover:text-[#EDE7DF]'
                  : 'text-[#7D756C] hover:text-[#2C2622]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>匯入備份還原 (Import)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'export'
                  ? isDark
                    ? 'bg-[#352E27] text-[#D4A373] shadow-xs'
                    : 'bg-white text-[#2C2622] shadow-xs'
                  : isDark
                  ? 'text-[#9E9488] hover:text-[#EDE7DF]'
                  : 'text-[#7D756C] hover:text-[#2C2622]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出備份 (Export)</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Active Tab Content */}
            {activeTab === 'export' ? (
              <>
                {/* Export Card */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-white border-[#EAE3D8]'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold">匯出備份檔案 (Export JSON)</h4>
                    <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#8C8379]'}`}>
                      將目前的 {trips.length} 趟旅行記帳打包下載為本地檔案
                    </p>
                  </div>
                  <button
                    id="backup-export-btn"
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 shadow-xs ${
                      isDark
                        ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                        : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? '匯出中...' : '匯出檔案'}</span>
                  </button>
                </div>

                {/* iPhone Quick Tip Box */}
                <div
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                    isDark
                      ? 'bg-[#1E1C1A] border-[#38312A] text-[#B0A79C]'
                      : 'bg-[#F6F2EA] border-[#E5DACB] text-[#6E645A]'
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">📱</span>
                  <div>
                    <strong className="font-semibold text-[#2C2622] dark:text-[#E8DFC9]">iPhone 使用小貼士：</strong>
                    點擊「匯出檔案」後，iPhone 會直接彈出分享選單，你可以點選<strong>「儲存到檔案 (Save to Files)」</strong>直接存入 iCloud 或手機；亦可直接透過 AirDrop 或 WhatsApp 傳給朋友作備份。
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Import Card */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-[#2A2521] border-[#38312A]' : 'bg-white border-[#EAE3D8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold">匯入備份檔案 (Import JSON)</h4>
                      <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#8C8379]'}`}>
                        上傳之前保存的 JSON 檔案或直接貼上文字還原
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPasteBox((prev) => !prev)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
                          showPasteBox
                            ? isDark
                              ? 'bg-[#3A332C] border-[#D4A373] text-[#D4A373]'
                              : 'bg-[#FAF0E1] border-[#8C6E54] text-[#8C6E54]'
                            : isDark
                            ? 'border-[#433B33] text-[#B0A79C] hover:bg-[#322C27]'
                            : 'border-[#D5CCC0] text-[#7A7168] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        {showPasteBox ? '選取檔案' : '貼上文字'}
                      </button>
                      {!showPasteBox && (
                        <label
                          htmlFor="backup-import-file-input"
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors shadow-2xs ${
                            isDark
                              ? 'border-[#55473A] bg-[#332A22] text-[#EDE7DF] hover:bg-[#40352B]'
                              : 'border-[#D5CCC0] bg-[#FAF6EE] text-[#5C544E] hover:bg-[#F0E9DD]'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-[#8C6E54] dark:text-[#D4A373]" />
                          <span>選取檔案</span>
                          <input
                            ref={fileInputRef}
                            id="backup-import-file-input"
                            type="file"
                            accept=".json,application/json,text/plain,*/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Optional Paste Text Box for zero-friction iOS copy/paste */}
                  {showPasteBox && (
                    <div className="pt-2 border-t border-[#EAE3D8] dark:border-[#38312A] space-y-2">
                      <textarea
                        rows={4}
                        value={pasteJsonText}
                        onChange={(e) => setPasteJsonText(e.target.value)}
                        placeholder="在此貼上任何旅割備份 JSON 文字..."
                        className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                          isDark
                            ? 'bg-[#1D1B19] border-[#433B33] text-[#EDE7DF]'
                            : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                        }`}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasteBox(false);
                            setPasteJsonText('');
                          }}
                          className="px-3 py-1 text-xs opacity-70 hover:opacity-100"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteImport}
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${
                            isDark
                              ? 'bg-[#D4A373] text-[#1A1816]'
                              : 'bg-[#2C2622] text-white'
                          }`}
                        >
                          確認匯入文字
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Reset to Sample Card */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-[#201D1A] border-[#38312A]' : 'bg-[#FAF7F2] border-[#EAE3D8]'
              }`}
            >
              <div>
                <h4 className="text-xs font-semibold">載入日系示範資料</h4>
                <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#8C8379]'}`}>
                  還原東京4人賞櫻、京都宇治2人旅示範帳目
                </p>
              </div>
              <button
                id="backup-reset-sample-btn"
                onClick={handleReset}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors shrink-0 ${
                  isDark
                    ? 'border-[#433B33] text-[#B5ABA0] hover:bg-[#2A2521]'
                    : 'border-[#E2D9CC] text-[#746C65] hover:bg-[#EFE9DE]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>載入範本</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE3D8] dark:border-[#38322B] flex justify-end">
            <button
              id="backup-modal-done-btn"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-[#2E2924] border-[#433B33] text-[#EDE7DF] hover:bg-[#38312B]'
                  : 'bg-[#FAF7F2] border-[#D5CCC0] text-[#2D2825] hover:bg-[#EFE9DE]'
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
