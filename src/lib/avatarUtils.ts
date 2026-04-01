export function getAvatarIcon(avatar: string): string {
  switch (avatar) {
    case "bird": return "\u{1F426}";
    case "dog": return "\u{1F415}";
    case "cat": return "\u{1F431}";
    default: return "\u{1F464}";
  }
}
