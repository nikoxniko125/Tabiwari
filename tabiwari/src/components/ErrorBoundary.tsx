import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, Download, AlertTriangle, ShieldCheck, Wrench, Upload } from 'lucide-react';
import { loadTrips, exportTripsAsJSON, clearActiveTripId, saveTrips, sanitizeTrip } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  importFeedback: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    importFeedback: null,
  };

  private fileInputRef = React.createRef<HTMLInputElement>();

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, importFeedback: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleBackHome = () => {
    try {
      clearActiveTripId();
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleExportBackup = async () => {
    try {
      const trips = loadTrips();
      await exportTripsAsJSON(trips);
    } catch (err) {
      alert('匯出時發生錯誤，請稍候重試。');
    }
  };

  private handleRepairData = () => {
    try {
      clearActiveTripId();
      const trips = loadTrips();
      if (Array.isArray(trips) && trips.length > 0) {
        saveTrips(trips);
      }
      this.setState({ hasError: false, error: null });
    } catch (err) {
      console.error('Repair failed:', err);
    }
    window.location.hash = '';
    window.location.reload();
  };

  private handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.trips)) list = parsed.trips;
          else if (Array.isArray(parsed.data)) list = parsed.data;
          else if (parsed.title || parsed.id) list = [parsed];
        }

        if (list.length > 0) {
          const sanitized = list.map((t, i) => sanitizeTrip(t, i));
          saveTrips(sanitized);
          clearActiveTripId();
          this.setState({
            importFeedback: `成功還原 ${sanitized.length} 趟旅行記帳！正在載入...`,
          });
          setTimeout(() => {
            this.setState({ hasError: false, error: null });
            window.location.hash = '';
            window.location.reload();
          }, 1200);
        } else {
          alert('檔案格式不符合，請確認為正確的旅割備份檔案。');
        }
      } catch (err) {
        alert('解析備份檔案失敗，請確認檔案格式。');
      }
    };
    reader.readAsText(file);
    if (this.fileInputRef.current) this.fileInputRef.current.value = '';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#FAF8F3] text-[#2C2622] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#EAE3D8] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fadeIn">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#FAF3EA] border border-[#ECDDCB] flex items-center justify-center mx-auto text-3xl shadow-xs">
              🍵
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EE] text-[#3D7A64] text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>資料已在安全保護中</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-mincho font-bold text-[#2C2622]">
                畫面暫時遇到小問題
              </h1>
              <p className="text-xs sm:text-sm text-[#746C65] leading-relaxed max-w-md mx-auto">
                請放心！你的所有旅行資料與記帳紀錄已自動儲存在本機與備份中。點擊下方按鈕即可立即恢復：
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleBackHome}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#2C2622] text-[#FAF8F3] text-sm font-medium hover:bg-[#433D39] transition-all shadow-xs"
              >
                <Home className="w-4 h-4" />
                <span>返回旅程首頁</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F4EFE6] border border-[#DDD5C7] text-[#2C2622] text-sm font-medium hover:bg-[#EAE2D2] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新整理頁面</span>
              </button>

              <button
                type="button"
                onClick={this.handleRepairData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5C7] text-[#8C6E54] text-xs font-medium hover:bg-[#FAF6EF] transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>一鍵修復並進入</span>
              </button>

              <button
                type="button"
                onClick={this.handleExportBackup}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5C7] text-[#3D7A64] text-xs font-medium hover:bg-[#F2FAF5] transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>安全下載 JSON 備份</span>
              </button>
            </div>

            {/* Direct Import File on Error Screen */}
            <div className="pt-2">
              <label
                htmlFor="error-boundary-import-input"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#FAF5ED] border border-[#D5C7B5] text-[#7A5E48] text-xs font-semibold hover:bg-[#F4ECE0] cursor-pointer transition-all shadow-2xs"
              >
                <Upload className="w-4 h-4 text-[#8C6E54]" />
                <span>選擇並匯入我的 JSON 備份檔案還原</span>
                <input
                  ref={this.fileInputRef}
                  id="error-boundary-import-input"
                  type="file"
                  accept=".json,application/json,text/plain,*/*"
                  onChange={this.handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {this.state.importFeedback && (
              <div className="p-3 rounded-xl bg-[#EBF5EE] text-[#3D7A64] text-xs font-medium">
                {this.state.importFeedback}
              </div>
            )}

            {/* Collapsible Error Technical Detail */}
            {this.state.error && (
              <details className="text-left text-[11px] bg-[#FAF8F4] border border-[#ECE5D8] rounded-xl p-3 text-[#8A7E72]">
                <summary className="cursor-pointer font-mono font-medium text-[#7A6E62] hover:text-[#2C2622]">
                  技術錯誤明細 (供診斷參考)
                </summary>
                <p className="mt-2 font-mono whitespace-pre-wrap break-all text-[#C85A53]">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
