import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Plus, Trash2, Users, Image as ImageIcon } from 'lucide-react';
import { Trip, TripSeason, TripStatus, Participant } from '../types';
import { PRESET_COVERS } from '../data/sampleTrips';
import { POPULAR_CURRENCIES } from '../utils/expenseConstants';
import { fileToBase64 } from '../utils/storage';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: Partial<Trip>) => void;
  initialTrip?: Trip | null;
  isDark?: boolean;
}

const AVATAR_COLORS = [
  '#4A7C59', '#D48C46', '#B85353', '#4682B4', '#8C6E54',
  '#6B5B95', '#D2691E', '#2E8B57', '#C71585', '#20B2AA'
];

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrip,
  isDark = false,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('日本');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('HKD');
  const [budget, setBudget] = useState<number | ''>('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [season, setSeason] = useState<TripSeason>('spring');
  const [status, setStatus] = useState<TripStatus>('ongoing');
  
  // Participants management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    if (initialTrip) {
      setTitle(initialTrip.title || '');
      setSubtitle(initialTrip.subtitle || '');
      setDestination(initialTrip.destination || '');
      setCountry(initialTrip.country || '日本');
      setStartDate(initialTrip.startDate || '');
      setEndDate(initialTrip.endDate || '');
      setBaseCurrency(initialTrip.baseCurrency || 'HKD');
      setBudget(initialTrip.budget || '');
      setCoverImage(initialTrip.coverImage || PRESET_COVERS[0].url);
      setSeason(initialTrip.season || 'spring');
      setStatus(initialTrip.status || 'ongoing');
      setParticipants(initialTrip.participants || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setTitle('');
      setSubtitle('');
      setDestination('日本・東京');
      setCountry('日本');
      setStartDate(today);
      setEndDate(nextWeek);
      setBaseCurrency('HKD');
      setBudget(25000);
      setCoverImage(PRESET_COVERS[0].url);
      setSeason('spring');
      setStatus('ongoing');
      setParticipants([
        { id: `p-${Date.now()}-1`, name: '我', avatarColor: '#4A7C59', isCurrentUser: true },
        { id: `p-${Date.now()}-2`, name: '阿明', avatarColor: '#D48C46' },
      ]);
    }
  }, [initialTrip, isOpen]);

  if (!isOpen) return null;

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;

    // 計算原本已設定的旅行天數（若無或不合理則預設 5 天）
    let durationDays = 5;
    if (startDate && endDate) {
      const s = new Date(startDate + 'T00:00:00').getTime();
      const e = new Date(endDate + 'T00:00:00').getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        durationDays = Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));
      }
    }

    // 自動同步回程日期的年月至出發日期當月（並加上預設或保留的遊玩天數）
    const sDate = new Date(newStart + 'T00:00:00');
    if (!isNaN(sDate.getTime())) {
      const eDate = new Date(sDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const eYear = eDate.getFullYear();
      const eMonth = String(eDate.getMonth() + 1).padStart(2, '0');
      const eDay = String(eDate.getDate()).padStart(2, '0');
      setEndDate(`${eYear}-${eMonth}-${eDay}`);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    if (startDate && newEnd && newEnd < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(newEnd);
    }
  };

  const handleAddParticipant = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    const colorIndex = participants.length % AVATAR_COLORS.length;
    const newP: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      avatarColor: AVATAR_COLORS[colorIndex],
    };
    setParticipants([...participants, newP]);
    setNewMemberName('');
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      alert('旅程至少需要保留 1 位參與者！');
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setCoverImage(base64);
    } catch (err) {
      console.error('File reading failed:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim() || !startDate || !endDate) return;

    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      destination: destination.trim(),
      country: country.trim(),
      startDate,
      endDate,
      baseCurrency,
      budget: budget ? Number(budget) : undefined,
      coverImage: customCoverUrl.trim() || coverImage,
      season,
      status,
      participants: participants.length > 0 ? participants : [
        { id: 'p-default', name: '我', avatarColor: '#4A7C59', isCurrentUser: true }
      ],
    });

    onClose();
  };

  return (
    <div
      id="trip-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="trip-modal-dialog"
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-6 transition-all ${
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
          <div>
            <h2 className="text-lg font-mincho font-semibold">
              {initialTrip ? '編輯旅程與分帳成員' : '建立新旅行記帳本'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#A09689]' : 'text-[#7D756C]'}`}>
              設定旅程目標、基準結算貨幣與同行旅伴
            </p>
          </div>
          <button
            id="trip-modal-close-btn"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              旅程名稱 <span className="text-[#C85A53]">*</span>
            </label>
            <input
              id="trip-title-input"
              type="text"
              required
              placeholder="例如：東京・春櫻漫步與下町居酒屋4人行"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                  : 'bg-white border-[#DDD5C7] text-[#2C2622] focus:border-[#8C6E54]'
              }`}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              副標題 / 旅程備註
            </label>
            <input
              id="trip-subtitle-input"
              type="text"
              placeholder="例如：箱根溫泉旅館、淺草雷門散策、新宿美食祭"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF] focus:border-[#D4A373]'
                  : 'bg-white border-[#DDD5C7] text-[#2C2622] focus:border-[#8C6E54]'
              }`}
            />
          </div>

          {/* Destination & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                目的地城市 / 地區 <span className="text-[#C85A53]">*</span>
              </label>
              <input
                id="trip-destination-input"
                type="text"
                required
                placeholder="例如：日本・東京 & 箱根"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                國家 / 地區
              </label>
              <input
                id="trip-country-input"
                type="text"
                placeholder="例如：日本、台灣、韓國..."
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  出發日期 <span className="text-[#C85A53]">*</span>
                </label>
                <input
                  id="trip-start-date-input"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  回程日期 <span className="text-[#C85A53]">*</span>
                </label>
                <input
                  id="trip-end-date-input"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                    isDark
                      ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                      : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                  }`}
                />
              </div>
            </div>

            {/* Quick Trip Duration Buttons */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[11px] font-medium ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                快速調整回程：
              </span>
              {[
                { label: '3天短遊', days: 2 },
                { label: '5天經典', days: 4 },
                { label: '7天深度', days: 6 },
                { label: '10天長假', days: 9 },
                { label: '14天巡禮', days: 13 },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    if (!startDate) return;
                    const sDate = new Date(startDate + 'T00:00:00');
                    if (!isNaN(sDate.getTime())) {
                      const eDate = new Date(sDate.getTime() + d.days * 24 * 60 * 60 * 1000);
                      const eYear = eDate.getFullYear();
                      const eMonth = String(eDate.getMonth() + 1).padStart(2, '0');
                      const eDay = String(eDate.getDate()).padStart(2, '0');
                      setEndDate(`${eYear}-${eMonth}-${eDay}`);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] border transition-colors ${
                    isDark
                      ? 'bg-[#2A2521] border-[#3D352D] hover:border-[#D4A373] text-[#D0C6B8]'
                      : 'bg-[#FAF8F3] border-[#E2D9CC] hover:border-[#8C6E54] text-[#63594F]'
                  }`}
                >
                  +{d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Base Currency & Total Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                結算基準貨幣 (Base Currency)
              </label>
              <select
                id="trip-base-currency-select"
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none font-medium ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                所有外幣消費將自動換算為此幣別進行結算分帳
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                總預算 ({baseCurrency})
              </label>
              <input
                id="trip-budget-input"
                type="number"
                min="0"
                placeholder="例如：30000"
                value={budget}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

          {/* Participants Management (同行旅伴人數) */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#2A2521] border-[#3D352D]' : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#8C6E54] dark:text-[#D4A373]" />
                <span>旅伴成員 ({participants.length} 人)</span>
              </label>
              <span className={`text-[11px] ${isDark ? 'text-[#9E9488]' : 'text-[#7D756C]'}`}>
                可在記帳時精準記錄邊個俾錢、邊個用咗幾多
              </span>
            </div>

            {/* Existing Participants List */}
            <div className="flex flex-wrap gap-2 mb-3">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs ${
                    isDark ? 'bg-[#322C27] border-[#433B33]' : 'bg-[#FAF8F3] border-[#E5DDD0]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-medium">{p.name}</span>
                  {p.isCurrentUser && (
                    <span className="text-[10px] opacity-60">(本人)</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="opacity-50 hover:opacity-100 hover:text-[#C55353] ml-0.5"
                    title="移除成員"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new member input */}
            <div className="flex gap-2">
              <input
                id="trip-new-participant-input"
                type="text"
                placeholder="輸入旅伴名字 (例如：阿明、Yuki、Chris)..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#1F1C1A] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-[#FAF8F3] border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
              <button
                type="button"
                id="trip-add-participant-btn"
                onClick={handleAddParticipant}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'bg-[#352F28] border-[#483F34] hover:bg-[#3D362E]'
                    : 'bg-[#F2ECE1] border-[#DFD3C3] hover:bg-[#EAE0D0]'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>加入旅伴</span>
              </button>
            </div>
          </div>

          {/* Season & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                旅途季節
              </label>
              <select
                id="trip-season-select"
                value={season}
                onChange={(e) => setSeason(e.target.value as TripSeason)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              >
                <option value="spring">🌸 春季 · 櫻花漫舞</option>
                <option value="summer">🌿 夏季 · 祭典綠意</option>
                <option value="autumn">🍁 秋季 · 楓葉銀杏</option>
                <option value="winter">❄️ 冬季 · 雪國溫泉</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                旅程進度
              </label>
              <select
                id="trip-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TripStatus)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              >
                <option value="ongoing">旅行中 (正在記錄中)</option>
                <option value="completed">已結束 (結算完成)</option>
                <option value="planning">籌備中 (行程規劃中)</option>
              </select>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              手帳封面照片
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {PRESET_COVERS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    setCoverImage(preset.url);
                    setCustomCoverUrl('');
                  }}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    coverImage === preset.url && !customCoverUrl
                      ? 'border-[#8C6E54] dark:border-[#D4A373]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  {coverImage === preset.url && !customCoverUrl && (
                    <div className="absolute inset-0 bg-[#8C6E54]/30 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-0.5 text-center truncate px-1">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] hover:bg-[#352E28]'
                  : 'bg-white border-[#DDD5C7] hover:bg-[#F5EFE6]'
              }`}>
                <Upload className="w-3.5 h-3.5" />
                <span>上傳封面</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                placeholder="或輸入圖片網址..."
                value={customCoverUrl}
                onChange={(e) => {
                  setCustomCoverUrl(e.target.value);
                  if (e.target.value) setCoverImage(e.target.value);
                }}
                className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                    : 'bg-white border-[#DDD5C7] text-[#2C2622]'
                }`}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-3 ${
              isDark ? 'border-[#38322B]' : 'border-[#EBE4D8]'
            }`}
          >
            <button
              type="button"
              id="trip-modal-cancel-btn"
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
              type="submit"
              id="trip-modal-submit-btn"
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all shadow-xs ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816] hover:bg-[#C29060]'
                  : 'bg-[#2C2622] text-[#FAF8F3] hover:bg-[#433D39]'
              }`}
            >
              {initialTrip ? '儲存設定' : '建立記帳本'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
