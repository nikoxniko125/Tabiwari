import { AppBranding } from '../types';

export const APP_ICON_COLORS = [
  { id: 'cream', name: '暖沙米白', hex: '#FAF7F2', textDark: true },
  { id: 'white', name: '純淨雅白', hex: '#FFFFFF', textDark: true },
  { id: 'dark', name: '曜石夜暮', hex: '#23201D', textDark: false },
  { id: 'torii', name: '朱紅鳥居', hex: '#C85A53', textDark: false },
  { id: 'matcha', name: '靜謐抹茶', hex: '#4A7C59', textDark: false },
  { id: 'amber', name: '琥珀山栗', hex: '#8C6E54', textDark: false },
  { id: 'sakura', name: '春櫻緋粉', hex: '#E8B4B8', textDark: true },
  { id: 'indigo', name: '深邃靛藍', hex: '#2B4162', textDark: false },
];

/**
 * Renders a high-resolution 512x512 or 1024x1024 app icon onto a canvas and returns its PNG Data URL
 */
export async function generateAppIconDataUrl(branding: AppBranding, size = 512): Promise<string> {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bgColor = branding.iconBgColor || '#FAF7F2';
  const isImageMode = branding.logoType === 'image' && Boolean(branding.customImageUrl);
  const imageFit = branding.imageFit || 'cover';

  // 1. Fill base background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  if (isImageMode && branding.customImageUrl) {
    try {
      const img = await loadImage(branding.customImageUrl);
      if (imageFit === 'cover') {
        // Full bleed cover crop
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let sWidth = img.naturalWidth;
        let sHeight = img.naturalHeight;
        let sx = 0;
        let sy = 0;

        if (imgAspect > 1) {
          sWidth = img.naturalHeight;
          sx = (img.naturalWidth - sWidth) / 2;
        } else {
          sHeight = img.naturalWidth;
          sy = (img.naturalHeight - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
      } else {
        // Contain with rounded inner frame
        const padding = size * 0.14;
        const innerSize = size - padding * 2;
        const scale = Math.min(innerSize / img.naturalWidth, innerSize / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      }
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Failed to load custom image for app icon, falling back:', err);
    }
  }

  // 2. Decorative subtle inner ring for preset / emoji icons
  ctx.strokeStyle = bgColor === '#23201D' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Draw Emoji / Preset Emblem
  let symbol = '⛩️';
  if (branding.logoType === 'emoji' && branding.customEmoji) {
    symbol = branding.customEmoji;
  } else if (branding.logoType === 'preset') {
    const PRESET_MAP: Record<string, string> = {
      compass: '🧭',
      sakura: '🌸',
      fuji: '🗻',
      torii: '⛩️',
      matcha: '🍵',
      onsen: '♨️',
      shinkansen: '🚅',
      lantern: '🏮',
      cat: '🐱',
      onigiri: '🍙',
      wallet: '💴',
      flight: '✈️',
    };
    symbol = PRESET_MAP[branding.presetIcon] || '⛩️';
  }

  const fontSize = Math.round(size * 0.52);
  ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Center alignment offset for emoji glyphs
  ctx.fillText(symbol, size / 2, size / 2 + size * 0.04);

  return canvas.toDataURL('image/png');
}

/**
 * Loads an image safely into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Injects the dynamic app icon into document head for iOS and Android PWA
 */
export async function applyAppBrandingToDocument(branding: AppBranding): Promise<void> {
  if (typeof document === 'undefined') return;

  try {
    const iconDataUrl = await generateAppIconDataUrl(branding, 512);
    if (!iconDataUrl) return;

    // 1. Apple Touch Icon (iOS Safari home screen icon)
    let appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.id = 'apple-touch-icon';
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = iconDataUrl;

    // 2. Favicon (Browser tabs)
    let favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.id = 'app-favicon';
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = iconDataUrl;

    // 3. Apple Mobile Web App Title
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
      document.head.appendChild(appleTitle);
    }
    appleTitle.setAttribute('content', branding.appName || '旅割');

    // 4. Update title
    document.title = `${branding.appName || '旅割'}・旅行記帳分帳`;
  } catch (err) {
    console.error('Failed to apply app branding to document:', err);
  }
}

/**
 * Triggers a direct download of the high-res 1024x1024 PNG icon
 */
export async function downloadAppIcon(branding: AppBranding, filename?: string): Promise<void> {
  const dataUrl = await generateAppIconDataUrl(branding, 1024);
  if (!dataUrl) return;

  const cleanName = (branding.appName || '旅割').replace(/[\\/:*?"<>|]/g, '_');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || `${cleanName}-app-icon.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
