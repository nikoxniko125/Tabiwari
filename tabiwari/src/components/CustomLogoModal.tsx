import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Smile,
  Download,
  Smartphone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  Camera,
  Layers,
} from 'lucide-react';
import { AppBranding } from '../types';
import { DEFAULT_BRANDING, fileToBase64 } from '../utils/storage';
import {
  generateAppIconDataUrl,
  downloadAppIcon,
  APP_ICON_COLORS,
} from '../utils/appIconUtils';

interface CustomLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: AppBranding;
  onSaveBranding: (newBranding: AppBranding) => void;
  isDark?: boolean;
}

export const PRESET_LOGOS = [
  { id: 'torii', emoji: '⛩️', name: '朱紅鳥居', desc: '神社參拜心願成真' },
  { id: 'fuji', emoji: '🗻', name: '富士靈山', desc: '雪頂富士日系經典' },
  { id: 'sakura', emoji: '🌸', name: '春櫻綻放', desc: '日本春季浪漫花見' },
  { id: 'compass', emoji: '🧭', name: '漫步羅盤', desc: '旅行方向與自由隨步' },
  { id: 'matcha', emoji: '🍵', name: '抹茶茶道', desc: '宇治甘味侘寂寧靜' },
  { id: 'onsen', emoji: '♨️', name: '溫泉暖湯', desc: '箱根草津極致放鬆' },
  { id: 'shinkansen', emoji: '🚅', name: '疾速新幹線', desc: '周遊列島鐵道旅行' },
  { id: 'lantern', emoji: '🏮', name: '居酒提燈', desc: '夜市宵夜美食歡聚' },
  { id: 'cat', emoji: '🐱', name: '吉祥招財', desc: '旅行平安財富豐盈' },
  { id: 'onigiri', emoji: '🍙', name: '三角飯糰', desc: '便利店早晨野餐滋味' },
  { id: 'wallet', emoji: '💴', name: '旅行錢包', desc: '日幣分帳清晰透明' },
  { id: 'flight', emoji: '✈️', name: '起飛探索', desc: '啟程遠方美好回憶' },
];

export const CustomLogoModal: React.FC<CustomLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  isDark = false,
}) => {
  const [logoType, setLogoType] = useState<'preset' | 'image' | 'emoji'>(
    branding.logoType || 'preset'
  );
  const [presetIcon, setPresetIcon] = useState<string>(branding.presetIcon || 'torii');
  const [customImageUrl, setCustomImageUrl] = useState<string>(branding.customImageUrl || '');
  const [customEmoji, setCustomEmoji] = useState<string>(branding.customEmoji || '🌸');
  const [appName, setAppName] = useState<string>(branding.appName || '旅割');
  const [appSubtitle, setAppSubtitle] = useState<string>(branding.appSubtitle || 'TABI-WARI');
  const [iconBgColor, setIconBgColor] = useState<string>(branding.iconBgColor || '#FAF7F2');
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>(branding.imageFit || 'cover');

  // Preview data URL state
  const [previewIconDataUrl, setPreviewIconDataUrl] = useState<string>('');
  const [showIphoneGuide, setShowIphoneGuide] = useState<boolean>(true);
  const [guideTab, setGuideTab] = useState<'safari' | 'shortcuts'>('safari');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if modal reopens
  useEffect(() => {
    if (isOpen) {
      setLogoType(branding.logoType || 'preset');
      setPresetIcon(branding.presetIcon || 'torii');
      setCustomImageUrl(branding.customImageUrl || '');
      setCustomEmoji(branding.customEmoji || '🌸');
      setAppName(branding.appName || '旅割');
      setAppSubtitle(branding.appSubtitle || 'TABI-WARI');
      setIconBgColor(branding.iconBgColor || '#FAF7F2');
      setImageFit(branding.imageFit || 'cover');
    }
  }, [isOpen, branding]);

  // Update dynamic preview icon
  useEffect(() => {
    if (!isOpen) return;
    const currentBranding: AppBranding = {
      logoType,
      presetIcon,
      customImageUrl: logoType === 'image' ? customImageUrl : undefined,
      customEmoji: logoType === 'emoji' ? customEmoji : undefined,
      appName: appName.trim() || '旅割',
      appSubtitle: appSubtitle.trim() || 'TABI-WARI',
      iconBgColor,
      imageFit,
    };

    let isMounted = true;
    generateAppIconDataUrl(currentBranding, 256)
      .then((url) => {
        if (isMounted) setPreviewIconDataUrl(url);
      })
      .catch((err) => console.error('Icon preview error:', err));

    return () => {
      isMounted = false;
    };
  }, [isOpen, logoType, presetIcon, customImageUrl, customEmoji, appName, appSubtitle, iconBgColor, imageFit]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('請選取小於 5MB 的圖片檔案');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCustomImageUrl(base64);
      setLogoType('image');
    } catch (err) {
      console.error('Failed to read image:', err);
    }
  };

  const handleSave = () => {
    const newBranding: AppBranding = {
      logoType,
      presetIcon,
      customImageUrl: logoType === 'image' ? customImageUrl : undefined,
      customEmoji: logoType === 'emoji' ? customEmoji : undefined,
      appName: appName.trim() || '旅割',
      appSubtitle: appSubtitle.trim() || 'TABI-WARI',
      iconBgColor,
      imageFit,
    };
    onSaveBranding(newBranding);
    onClose();
  };

  const handleReset = () => {
    setLogoType('preset');
    setPresetIcon('torii');
    setCustomImageUrl('');
    setCustomEmoji('🌸');
    setAppName('旅割');
    setAppSubtitle('TABI-WARI');
    setIconBgColor('#FAF7F2');
    setImageFit('cover');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const currentBranding: AppBranding = {
        logoType,
        presetIcon,
        customImageUrl: logoType === 'image' ? customImageUrl : undefined,
        customEmoji: logoType === 'emoji' ? customEmoji : undefined,
        appName: appName.trim() || '旅割',
        appSubtitle: appSubtitle.trim() || 'TABI-WARI',
        iconBgColor,
        imageFit,
      };
      await downloadAppIcon(currentBranding);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentPreset = PRESET_LOGOS.find((p) => p.id === presetIcon) || PRESET_LOGOS[0];

  return (
    <div
      id="custom-logo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="custom-logo-modal-dialog"
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-all ${
          isDark
            ? 'bg-[#211E1B] border-[#3C352E] text-[#EDE7DF]'
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
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#3A332C] text-[#D4A373]' : 'bg-[#EAE0D0] text-[#8C6E54]'
              }`}
            >
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-mincho font-semibold flex items-center gap-2">
                <span>自訂 iPhone 主畫面圖案與 Logo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-sans font-medium bg-[#E8F0E6] text-[#42693E] dark:bg-[#253528] dark:text-[#81B29A]">
                  私家自訂
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                上載狗狗/個人照片或日系標誌，告別預設黑框，完美呈現於 iPhone 桌面
              </p>
            </div>
          </div>
          <button
            id="custom-logo-modal-close-btn"
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* 1. iPhone Home Screen Live Mockup Preview */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#1C1A18] via-[#24211D] to-[#2B2621] border-[#3D352D]'
                : 'bg-gradient-to-br from-[#F5EFE6] via-[#FAF6EE] to-[#EAE0D0] border-[#E5DBCB]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              {/* Phone home screen simulator */}
              <div className="flex items-center gap-5">
                {/* iOS App Icon Container with iOS Squircle radius ~22.5% */}
                <div className="relative group">
                  <div
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22%] shadow-md border overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
                    style={{
                      backgroundColor: iconBgColor,
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {previewIconDataUrl ? (
                      <img
                        src={previewIconDataUrl}
                        alt="iPhone App Icon Preview"
                        className="w-full h-full object-cover select-none"
                      />
                    ) : (
                      <span className="text-3xl">⛩️</span>
                    )}
                  </div>
                  {/* Subtle iOS Glass highlight shine effect */}
                  <div className="absolute inset-0 rounded-[22%] pointer-events-none ring-1 ring-white/20 shadow-inner" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      iPhone 主畫面效果預覽
                    </span>
                  </div>
                  {/* Label under icon */}
                  <div className="text-lg font-bold font-sans tracking-wide">
                    {appName.trim() || '旅割'}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-[#A89F93]' : 'text-[#6D655E]'}`}>
                    告別黑色方塊！桌面將以精巧簡約名稱展示
                  </p>
                </div>
              </div>

              {/* Action buttons on the right */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'border-[#4A4036] bg-[#2E2822] text-[#D4A373] hover:bg-[#3B342C]'
                      : 'border-[#DECFC0] bg-white text-[#785E48] hover:bg-[#F7F2EA]'
                  }`}
                  title="下載 1024x1024 高清圖標至手機相簿"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? '生成中...' : '下載高清圖標 PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                    isDark
                      ? 'border-[#3D352D] text-[#A09689] hover:bg-[#2A2521]'
                      : 'border-[#E2D9CC] text-[#786F67] hover:bg-[#F5EFE6]'
                  }`}
                  title="恢復預設圖標"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Mode Selector Tabs */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold">選擇圖案來源：</label>
            <div
              className={`grid grid-cols-3 p-1 rounded-2xl border text-xs font-medium ${
                isDark ? 'bg-[#27231F] border-[#38312A]' : 'bg-[#F2ECE1] border-[#E2D9CC]'
              }`}
            >
              <button
                type="button"
                onClick={() => setLogoType('image')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  logoType === 'image'
                    ? isDark
                      ? 'bg-[#D4A373] text-[#1A1816] font-bold shadow-xs'
                      : 'bg-white text-[#2C2622] font-bold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>上傳私家相片</span>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('preset')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  logoType === 'preset'
                    ? isDark
                      ? 'bg-[#D4A373] text-[#1A1816] font-bold shadow-xs'
                      : 'bg-white text-[#2C2622] font-bold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>日系精選標誌</span>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('emoji')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  logoType === 'emoji'
                    ? isDark
                      ? 'bg-[#D4A373] text-[#1A1816] font-bold shadow-xs'
                      : 'bg-white text-[#2C2622] font-bold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>自訂 Emoji</span>
              </button>
            </div>
          </div>

          {/* 3. Tab Contents */}
          {/* A. Custom Image Upload */}
          {logoType === 'image' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  customImageUrl
                    ? isDark
                      ? 'border-[#5A4F41] bg-[#27221E]'
                      : 'border-[#C8B8A6] bg-[#FAF5ED]'
                    : isDark
                    ? 'border-[#433B33] bg-[#2A2521] hover:border-[#D4A373]'
                    : 'border-[#D5CCC0] bg-[#FAF7F2] hover:border-[#8C6E54]'
                }`}
              >
                {customImageUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border shadow-sm shrink-0">
                      <img
                        src={customImageUrl}
                        alt="Uploaded Custom Image"
                        className={`w-full h-full ${
                          imageFit === 'cover' ? 'object-cover' : 'object-contain p-1.5'
                        }`}
                        style={{ backgroundColor: iconBgColor }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-left space-y-1">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 已成功載入相片
                      </span>
                      <p className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                        點擊此處可隨時更換其他相片（如愛犬、情侶合照或旅行美照）
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isDark ? 'bg-[#332C26] text-[#D4A373]' : 'bg-[#EFE7DC] text-[#8C6E54]'
                      }`}
                    >
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold">
                      點擊選擇手機相簿相片（狗狗/貓貓/旅行照片）
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#847C74]'}`}>
                      支援 JPG、PNG、WebP，即選即套用
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Photo Display Style: Cover vs Contain */}
              {customImageUrl && (
                <div className="flex items-center justify-between p-3 rounded-2xl border text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                    <span className="font-semibold">照片呈現方式：</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageFit('cover')}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        imageFit === 'cover'
                          ? isDark
                            ? 'bg-[#D4A373] text-[#1A1816] font-bold'
                            : 'bg-[#2C2622] text-white font-bold'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      滿版填滿 (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFit('contain')}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        imageFit === 'contain'
                          ? isDark
                            ? 'bg-[#D4A373] text-[#1A1816] font-bold'
                            : 'bg-[#2C2622] text-white font-bold'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      精巧留邊 (Contain)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. Presets */}
          {logoType === 'preset' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                選擇日系文化意象圖標：
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_LOGOS.map((item) => {
                  const isSelected = presetIcon === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPresetIcon(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#382F24] border-[#D4A373] shadow-xs ring-1 ring-[#D4A373]'
                            : 'bg-[#FAF0E1] border-[#8C6E54] shadow-xs ring-1 ring-[#8C6E54]'
                          : isDark
                          ? 'bg-[#2A2521] border-[#38312A] hover:border-[#4A3E31]'
                          : 'bg-white border-[#EAE3D8] hover:border-[#D5C9B8]'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold leading-tight truncate">
                          {item.name}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. Emoji */}
          {logoType === 'emoji' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold">
                輸入喜愛的 Emoji 表情或符號：
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder="🌸"
                  className={`w-20 text-center text-3xl p-2 rounded-2xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
                <div className={`text-xs ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                  可在手機鍵盤直接輸入 Emoji（例如：🐶、✈️、🗼、🍱、🍣、🍺、🎡、⛰️）
                </div>
              </div>
            </div>
          )}

          {/* 4. Background Color Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold">
                圖標背景色底韻：
              </label>
              <span className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                搭配 iPhone 桌布色調
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {APP_ICON_COLORS.map((c) => {
                const isSelected = iconBgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setIconBgColor(c.hex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#8C6E54] dark:ring-[#D4A373] font-bold shadow-xs'
                        : 'opacity-80 hover:opacity-100'
                    } ${
                      isDark
                        ? 'bg-[#28231F] border-[#3F362D]'
                        : 'bg-white border-[#E0D7C9]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: 'rgba(0,0,0,0.15)',
                      }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. App Name & Subtitle */}
          <div className="space-y-3 pt-4 border-t border-[#EAE3D8] dark:border-[#38322B]">
            <h4 className="text-xs font-semibold">iPhone 桌面標籤與 App 標題</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'
                  }`}
                >
                  iPhone 桌面圖標名稱（建議 2-4 字，避免截斷）
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="旅割"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'
                  }`}
                >
                  副標題英文代碼
                </label>
                <input
                  type="text"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  placeholder="TABI-WARI"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 6. iPhone Setup Guide (Accordion) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#1D1B19] border-[#38312A]' : 'bg-[#F9F5EE] border-[#E8DFC9]'
            }`}
            style={{
              backgroundColor: isDark ? '#1D1B19' : '#F9F5EE',
              color: isDark ? '#EDE7DF' : '#2C2622'
            }}
          >
            <button
              type="button"
              onClick={() => setShowIphoneGuide((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold focus:outline-none"
            >
              <div className="flex items-center gap-2 text-[#8C6E54] dark:text-[#D4A373]">
                <HelpCircle className="w-4 h-4" />
                <span>📱 怎樣將這個私家圖案換到 iPhone 主畫面上？</span>
              </div>
              {showIphoneGuide ? (
                <ChevronUp className="w-4 h-4 opacity-70" />
              ) : (
                <ChevronDown className="w-4 h-4 opacity-70" />
              )}
            </button>

            {showIphoneGuide && (
              <div 
                className="px-4 pb-4 pt-1 space-y-3 text-xs border-t border-[#EAE1D3] dark:border-[#332C25]"
                style={{
                  backgroundColor: isDark ? '#1D1B19' : '#F9F5EE',
                  color: isDark ? '#EDE7DF' : '#2C2622'
                }}
              >
                {/* Method selector */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuideTab('safari')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      guideTab === 'safari'
                        ? 'bg-[#3D7A64] text-white shadow-xs'
                        : isDark ? 'text-[#ABA195] hover:text-white' : 'text-[#746C65] hover:text-[#2C2622]'
                    }`}
                  >
                    方法 1：Safari 重新加入主畫面（最推薦）
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('shortcuts')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      guideTab === 'shortcuts'
                        ? 'bg-[#3D7A64] text-white shadow-xs'
                        : isDark ? 'text-[#ABA195] hover:text-white' : 'text-[#746C65] hover:text-[#2C2622]'
                    }`}
                  >
                    方法 2：iOS 捷徑換圖（100% 自由相片）
                  </button>
                </div>

                {guideTab === 'safari' ? (
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#28231E] border border-[#E5DACB] dark:border-[#40372E] text-[#2C2622] dark:text-[#EDE7DF] space-y-2.5 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#8C6E54] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          在上方選好你心儀的<strong>私家照片 / 標誌</strong>，然後點擊下方<strong>「保存 Logo 設定」</strong>。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#8C6E54] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          回到 iPhone 主螢幕，長按原本那個黑色「旅」字圖標，點<strong>「刪除書籤／移除 App」</strong>。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#8C6E54] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          在 iPhone Safari 打開本網頁，點底部工具列<strong>「分享按鈕 ⬆️」</strong> ➡️ 滑動點選<strong>「加入主畫面 ➕」</strong>。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          4
                        </span>
                        <span className="text-[#2F6552] dark:text-[#81B29A] font-semibold">
                          完成！Safari 會自動抓取最新圖案與簡短名稱「旅割」，不再顯示黑底字！
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#28231E] border border-[#E5DACB] dark:border-[#40372E] text-[#2C2622] dark:text-[#EDE7DF] space-y-2.5 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          在上方點<strong>「下載高清圖標 PNG」</strong>存入 iPhone 相簿，或準備好相簿裡的任何愛犬／個人相片。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          打開 iPhone 內建<strong>「捷徑 (Shortcuts)」</strong>App，點右上角<strong>「＋」</strong>新增捷徑。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          點「加入動作」➡️ 搜尋並選<strong>「打開 URL (Open URLs)」</strong>➡️ 貼上此 App 網址。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          4
                        </span>
                        <span>
                          點頂部捷徑名稱旁邊的向下箭頭 ➡️ 選擇<strong>「加入至主畫面」</strong>。
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D7A64] text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          5
                        </span>
                        <span>
                          點擊左邊圖示圖案 ➡️<strong>「選擇照片」</strong>➡️ 揀相簿裡的任何相片 ➡️ 點「加入」，桌面便會呈現你專屬的 iPhone App 圖案！
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. Bottom Dialog Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-[#38322B]' : 'border-[#EBE4D8]'
            }`}
          >
            <div className={`text-[11px] ${isDark ? 'text-[#8C8377]' : 'text-[#7D756C]'}`}>
              點擊保存後，所有分帳與導覽列將即時同步更新
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-[#433B33] text-[#B5ABA0] hover:bg-[#2A2521]'
                    : 'border-[#DDD5C7] text-[#6A625A] hover:bg-[#F5EFE6]'
                }`}
              >
                取消
              </button>
              <button
                id="custom-logo-modal-save-btn"
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                  isDark
                    ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                    : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存 Logo 設定</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
