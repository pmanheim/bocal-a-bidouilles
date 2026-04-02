export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
}

/** All available avatar choices for kid profiles */
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "dog", emoji: "\u{1F436}", label: "Dog" },
  { id: "cat", emoji: "\u{1F431}", label: "Cat" },
  { id: "bird", emoji: "\u{1F426}", label: "Bird" },
  { id: "penguin", emoji: "\u{1F427}", label: "Penguin" },
  { id: "unicorn", emoji: "\u{1F984}", label: "Unicorn" },
  { id: "fox", emoji: "\u{1F98A}", label: "Fox" },
  { id: "bunny", emoji: "\u{1F430}", label: "Bunny" },
  { id: "panda", emoji: "\u{1F43C}", label: "Panda" },
  { id: "butterfly", emoji: "\u{1F98B}", label: "Butterfly" },
  { id: "alien", emoji: "\u{1F47D}", label: "Alien" },
  { id: "robot", emoji: "\u{1F916}", label: "Robot" },
  { id: "dragon", emoji: "\u{1F409}", label: "Dragon" },
];

/** Kid-friendly color palette for profile accent colors */
export const COLOR_PALETTE = [
  { hex: "#4CAF50", label: "Green" },
  { hex: "#2196F3", label: "Blue" },
  { hex: "#E91E63", label: "Pink" },
  { hex: "#9C27B0", label: "Purple" },
  { hex: "#FF9800", label: "Orange" },
  { hex: "#009688", label: "Teal" },
  { hex: "#F44336", label: "Red" },
  { hex: "#FFC107", label: "Yellow" },
  { hex: "#3F51B5", label: "Indigo" },
  { hex: "#00BCD4", label: "Cyan" },
];

const avatarMap = new Map(AVATAR_OPTIONS.map((a) => [a.id, a.emoji]));

/** Returns the emoji for an avatar identifier */
export function getAvatarIcon(avatar: string): string {
  return avatarMap.get(avatar) ?? "\u{1F464}";
}

/** Returns the label for an avatar identifier */
export function getAvatarLabel(avatar: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatar)?.label ?? "Unknown";
}
