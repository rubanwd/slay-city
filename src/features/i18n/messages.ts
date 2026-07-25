import type { TaskFamily } from "@/features/parent/taskFamilies";

/**
 * Every string the parent console shows, in one shape.
 *
 * Counts and names arrive as function messages rather than templates with
 * placeholders, so each language can put the number where its grammar wants it
 * and pick its own plural form (see {@link file://./plural.ts}).
 *
 * Nothing authored by a teacher or an admin belongs here: district, location,
 * mission and homework titles stay in the language they were written in.
 */
export interface Messages {
  nav: {
    dashboard: string;
    map: string;
    profile: string;
  };

  common: {
    logOut: string;
    loading: string;
    loggingOut: string;
    /** Hours + minutes, e.g. "2 h 15 min" — units differ per language. */
    duration: (hours: number, minutes: number) => string;
    never: string;
  };

  dashboard: {
    title: string;
    progressOf: (studentName: string) => string;
    linking: (email: string) => string;
    noStudentLinked: string;
    yourStudent: string;

    pendingTitle: string;
    pendingNotRegistered: (who: string) => string;
    pendingNoProfile: (who: string) => string;
    pendingNotAStudent: (who: string) => string;
    pendingNoEmail: string;

    englishLevel: string;
    lastActive: string;
    lookLabel: string;
    xp: string;
    coins: string;

    vocabularyTitle: string;
    words: (count: number) => string;

    studyTimeTitle: string;
    studyTimeToday: string;
    studyTimeWeek: string;
    studyTimeTotal: string;
    studyTimeEmpty: string;
    studyTimeHint: string;
    weekdayInitials: readonly [string, string, string, string, string, string, string];

    missionsCompleted: string;
    tasksCompleted: string;
    currentStreak: string;
    longestStreak: string;
    days: (count: number) => string;

    mapProgressTitle: string;
    locationsUnlockedOf: (unlocked: number, total: number) => string;

    practiceTitle: string;
    practiceHint: string;
    practiceEmpty: string;
    families: Record<TaskFamily, string>;
    tasks: (count: number) => string;

    homeworkTitle: string;
    homeworkEmpty: string;
    homeworkHint: string;
    homeworkPassed: string;
    homeworkInProgress: string;
    homeworkNotStarted: string;
    homeworkVocabulary: string;
    homeworkGrammar: string;
    homeworkWords: (count: number) => string;
    homeworkRules: (count: number) => string;
    homeworkTeacher: (teacherName: string) => string;

    recentTitle: string;
    recentEmpty: string;
    recentScore: (score: number) => string;
  };

  profile: {
    title: string;
    roleLabel: string;
    signedIn: string;
    languageTitle: string;
    languageHint: string;
    languageAuto: string;
    languageAutoHint: (detected: string) => string;
    studentTitle: string;
    studentLevelHint: string;
    studentNone: string;
  };

  map: {
    title: string;
    subtitle: string;
    nothingTitle: string;
    nothingBody: (levelName: string) => string;
    districtOf: (index: number, total: number) => string;
    previousDistrict: string;
    nextDistrict: string;
    completedBy: (who: string) => string;
    missionsProgress: (completed: number, total: number) => string;
    missionsCount: (count: number) => string;
    noLocations: string;
    loadingMap: string;
    selectedLocation: string;
    earnedHere: string;
    toEarnHere: string;
    /** Only the teacher console can open a location; kept so the shape is complete. */
    openMissions: string;
    openLocation: string;
  };
}
