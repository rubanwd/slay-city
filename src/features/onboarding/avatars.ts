export interface AvatarOption {
  id: string;
  url: string;
  label: string;
}

/** Preset avatars shown in onboarding. Kept as an allow-list so the server
 * action never has to trust an arbitrary client-supplied URL. */
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "avatar-1", url: "/avatars/avatar-1.svg", label: "Pink" },
  { id: "avatar-2", url: "/avatars/avatar-2.svg", label: "Lime" },
  { id: "avatar-3", url: "/avatars/avatar-3.svg", label: "Cyan" },
  { id: "avatar-4", url: "/avatars/avatar-4.svg", label: "Purple" },
  { id: "avatar-5", url: "/avatars/avatar-5.svg", label: "Pink Outline" },
  { id: "avatar-6", url: "/avatars/avatar-6.svg", label: "Cyan Outline" },
];

export const DEFAULT_AVATAR_URL = AVATAR_OPTIONS[0].url;
