/**
 * The tab model behind {@link file://./BottomNav.tsx}. Pure data + pure
 * functions, kept out of the client component so the routing rules can be unit
 * tested without rendering anything.
 */

/**
 * Which set of tabs the bottom bar shows. Children play the game (map,
 * wardrobe, homework); parents and teachers get their own console's dashboard
 * plus a read-only map and their profile.
 */
export type NavRole = "child" | "parent" | "teacher";

/** Icon each tab draws — resolved to an SVG inside `BottomNav`. */
export type NavIconName = "map" | "wardrobe" | "homework" | "profile" | "dashboard";

export interface NavItemModel {
  label: string;
  href: string;
  icon: NavIconName;
}

export interface NavItemOptions {
  /** Child only: shows the Homework tab when they belong to a teacher group. */
  showHomework?: boolean;
}

const CHILD_ITEMS: NavItemModel[] = [
  { label: "Map", href: "/map", icon: "map" },
  { label: "Wardrobe", href: "/wardrobe", icon: "wardrobe" },
];

const CHILD_HOMEWORK_ITEM: NavItemModel = {
  label: "Homework",
  href: "/homework",
  icon: "homework",
};

const CHILD_PROFILE_ITEM: NavItemModel = { label: "Profile", href: "/profile", icon: "profile" };

/**
 * Parents and teachers share one shape — dashboard, map, profile — under their
 * own area prefix, because middleware confines each role to that prefix.
 */
function consoleItems(base: "/parent" | "/teacher"): NavItemModel[] {
  return [
    { label: "Dashboard", href: base, icon: "dashboard" },
    { label: "Map", href: `${base}/map`, icon: "map" },
    { label: "Profile", href: `${base}/profile`, icon: "profile" },
  ];
}

/** The tabs a given role sees, in display order. */
export function navItemsForRole(
  role: NavRole,
  { showHomework = false }: NavItemOptions = {}
): NavItemModel[] {
  if (role === "parent") return consoleItems("/parent");
  if (role === "teacher") return consoleItems("/teacher");
  return showHomework
    ? [...CHILD_ITEMS, CHILD_HOMEWORK_ITEM, CHILD_PROFILE_ITEM]
    : [...CHILD_ITEMS, CHILD_PROFILE_ITEM];
}

/**
 * Index of the tab the current path belongs to, or -1 when none does (e.g. a
 * child inside a mission). A tab owns its own path and everything below it, and
 * the *most specific* match wins — `/parent/map` belongs to the Map tab even
 * though the Dashboard tab (`/parent`) is a prefix of it too.
 */
export function activeNavIndex(
  pathname: string,
  items: readonly Pick<NavItemModel, "href">[]
): number {
  let activeIndex = -1;
  let matchedLength = -1;

  items.forEach((item, index) => {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && item.href.length > matchedLength) {
      activeIndex = index;
      matchedLength = item.href.length;
    }
  });

  return activeIndex;
}
