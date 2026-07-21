/**
 * Name of the cookie that holds the teacher id an admin is currently "viewing
 * as". Kept in its own runtime-import-free module so the edge middleware can
 * read it without pulling in `next/headers` (which `viewAs.ts` uses).
 */
export const VIEW_AS_TEACHER_COOKIE = "slay_view_as_teacher";
