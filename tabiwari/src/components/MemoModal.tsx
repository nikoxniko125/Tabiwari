import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { TripMemo, Trip } from '../types';

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memoData: Omit<TripMemo, 'id'>) => void;
  trip: Trip;
  isDark?: boolean;
}

export const MemoModal: React.FC<MemoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trip,
  isDark = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'booking' | 'tax_free' | 'note' | 'wifi'>('note');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      updatedAt: new Date().toISOString(),
    });

    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div
      id="memo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="memo-modal-dialog"
        className={`w-full max-w-md rounded-3xl border shadow-xl overflow-hidden my-6 transition-all ${
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
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#8C6E54] dark:text-[#D4A373]" />
            <h3 className="text-base font-mincho font-semibold">
              新增旅途備忘與筆記
            </h3>
          </div>
          <button
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              備忘類別
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                  : 'bg-white border-[#DDD5C7] text-[#2C2622]'
              }`}
            >
              <option value="booking">🍽️ 餐廳/居酒屋/活動訂位</option>
              <option value="tax_free">🛍️ 退稅提醒與優惠券</option>
              <option value="wifi">📶 漫遊/Wi-Fi/交通卡設定</option>
              <option value="note">📝 一般行程與購物筆記</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              標題 <span className="text-[#C55353]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：六本木居酒屋訂位確認號、BicCamera 7%免稅折價券"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                  : 'bg-white border-[#DDD5C7] text-[#2C2622]'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              內容說明 <span className="text-[#C55353]">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="輸入預約時間、聯絡電話、條碼編號或重要備忘細項..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none leading-relaxed ${
                isDark
                  ? 'bg-[#2A2521] border-[#433B33] text-[#EDE7DF]'
                  : 'bg-white border-[#DDD5C7] text-[#2C2622]'
              }`}
            />
          </div>

          <div
            className={`pt-3 border-t flex items-center justify-end gap-2.5 ${
              isDark ? 'border-[#38322B]' : 'border-[#EBE4D8]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                isDark
                  ? 'border-[#433B33] text-[#B5ABA0] hover:bg-[#2A2521]'
                  : 'border-[#DDD5C7] text-[#6A625A] hover:bg-[#F5EFE6]'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-medium ${
                isDark
                  ? 'bg-[#D4A373] text-[#1A1816]'
                  : 'bg-[#2C2622] text-[#FAF8F3]'
              }`}
            >
              儲存備忘
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
