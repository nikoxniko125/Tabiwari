// Participant color helper & deterministic avatar color palette

export const PARTICIPANT_PALETTE = [
  '#4A7C59', // 抹茶深綠 Forest Sage
  '#D48C46', // 琥珀赤橘 Amber Clay
  '#B85353', // 茜紅 Crimson Rose
  '#4682B4', // 琉璃藍 Steel Blue
  '#8C6E54', // 檜木棕 Warm Cypress
  '#6B5B95', // 桔梗紫 Iris Lavender
  '#D2691E', // 柿色 Ochre Russet
  '#2E8B57', // 深海松 Green Forest
  '#C71585', // 櫻梅紅 Plum Rose
  '#20B2AA', // 青碧色 Sea Teal
  '#8A6240', // 栗色 Chestnut
  '#5C6B73', // 藍鼠灰 Slate Indigo
];

/**
 * Returns a deterministic, consistent, vibrant color for a participant
 * even if their stored avatarColor is missing, undefined, or identical.
 */
export function getParticipantColor(
  participant?: { id?: string; name?: string; avatarColor?: string } | null,
  index?: number
): string {
  if (participant?.avatarColor && participant.avatarColor.trim() !== '' && participant.avatarColor !== '#000000') {
    return participant.avatarColor;
  }

  // If index is provided, use index
  if (typeof index === 'number' && index >= 0) {
    return PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];
  }

  // Use participant id hash or name hash
  const seed = participant?.id || participant?.name || 'p';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveIndex = Math.abs(hash) % PARTICIPANT_PALETTE.length;
  return PARTICIPANT_PALETTE[positiveIndex];
}
