import type { Messages } from "../messages";
import { pluralSlavic } from "../plural";

/** Ukrainian. */
export const uk: Messages = {
  nav: {
    dashboard: "Огляд",
    map: "Карта",
    profile: "Профіль",
  },

  common: {
    logOut: "Вийти",
    loading: "Завантажуємо кабінет…",
    loggingOut: "Виходимо…",
    duration: (hours, minutes) => {
      if (hours === 0 && minutes === 0) return "0 хв";
      if (hours === 0) return `${minutes} хв`;
      if (minutes === 0) return `${hours} год`;
      return `${hours} год ${minutes} хв`;
    },
    never: "Ніколи",
  },

  dashboard: {
    title: "Кабінет батьків",
    progressOf: (studentName) => `Прогрес: ${studentName}`,
    linking: (email) => `Підключаємо ${email}`,
    noStudentLinked: "Дитину ще не підключено",
    yourStudent: "ваша дитина",

    pendingTitle: "Прогресу ще немає",
    pendingNotRegistered: (who) =>
      `${who} ще не приєдналася до Slay City. Щойно вона зареєструється з цією поштою як учень, прогрес з’явиться тут автоматично.`,
    pendingNoProfile: (who) =>
      `${who} зареєструвалася, але ще не завершила налаштування профілю. Прогрес з’явиться одразу після цього.`,
    pendingNotAStudent: (who) =>
      `Акаунт ${who} не є учнівським, тому навчального прогресу немає.`,
    pendingNoEmail: "До цього батьківського акаунта ще не підключено жодного учня.",

    englishLevel: "Рівень англійської",
    lastActive: "Остання активність",
    lookLabel: "Сьогоднішній образ",
    xp: "XP",
    coins: "Монети",

    vocabularyTitle: "Вивчені слова",
    words: (count) => pluralSlavic(count, "слово", "слова", "слів"),

    studyTimeTitle: "Час навчання",
    studyTimeToday: "Сьогодні",
    studyTimeWeek: "Останні 7 днів",
    studyTimeTotal: "За весь час",
    studyTimeEmpty: "Часу навчання ще не зафіксовано.",
    studyTimeHint: "Рахується лише поки відкрита місія або домашнє завдання.",
    weekdayInitials: ["П", "В", "С", "Ч", "П", "С", "Н"],

    missionsCompleted: "Пройдено місій",
    tasksCompleted: "Виконано завдань",
    currentStreak: "Поточна серія",
    longestStreak: "Найдовша серія",
    days: (count) => pluralSlavic(count, "день", "дні", "днів"),

    mapProgressTitle: "Прогрес на карті міста",
    locationsUnlockedOf: (unlocked, total) => `Відкрито ${unlocked} із ${total} локацій`,

    practiceTitle: "Що дитина відпрацьовує",
    practiceHint: "Завдання всередині пройдених місій.",
    practiceEmpty: "Поки що нічого не відпрацьовано.",
    families: {
      words: "Слова й правопис",
      sentences: "Речення й читання",
      thinking: "Ігри на мислення",
    },
    tasks: (count) => pluralSlavic(count, "завдання", "завдання", "завдань"),

    homeworkTitle: "Теми домашніх завдань",
    homeworkEmpty: "Домашніх завдань ще не задано.",
    homeworkHint: "Теми, які задає вчитель.",
    homeworkPassed: "Складено",
    homeworkInProgress: "У процесі",
    homeworkNotStarted: "Не розпочато",
    homeworkVocabulary: "Лексика",
    homeworkGrammar: "Граматика",
    homeworkWords: (count) => `${count} ${pluralSlavic(count, "слово", "слова", "слів")}`,
    homeworkRules: (count) => `${count} ${pluralSlavic(count, "правило", "правила", "правил")}`,
    homeworkTeacher: (teacherName) => `Учитель: ${teacherName}`,

    recentTitle: "Остання активність",
    recentEmpty: "Жодної місії ще не пройдено.",
    recentScore: (score) => `${score}%`,
  },

  profile: {
    title: "Профіль",
    roleLabel: "Батьки",
    signedIn: "Ви увійшли",
    languageTitle: "Мова",
    languageHint: "Змінює мову вашого кабінету, карти та профілю.",
    languageAuto: "Автоматично",
    languageAutoHint: (detected) => `За мовою браузера — зараз ${detected}.`,
    studentTitle: "Ваша дитина",
    studentLevelHint: "Рівень, який вивчає дитина — вона обирає його сама.",
    studentNone: "Дитину ще не підключено.",
  },

  student: {
    nav: {
      map: "Карта",
      wardrobe: "Гардероб",
      homework: "Домашка",
      profile: "Профіль",
    },

    profile: {
      title: "Профіль",
      characterLabel: "Твій персонаж",
      signedIn: "Ти увійшов",

      languageTitle: "Мова",
      languageHint: "Змінює кнопки й меню. Місії лишаються англійською — це і є урок.",

      levelTitle: "Рівень",
      levelChange: "Змінити",
      levelClose: "Закрити",
      levelSwitching: "Змінюємо рівень…",
      levelOnlyOne: "Нові рівні відкриються, коли в місті з’являться нові райони.",
      levelComingSoon: (levels) => `Скоро: ${levels}.`,

      logOut: "Вийти",
      loggingOut: "Виходимо…",
      resetProgress: "Скинути прогрес (dev)",
      resetting: "Скидаємо…",
      resetConfirm:
        "Стерти весь твій прогрес у місіях, XP, монети та серії? Це не можна скасувати.",
    },
  },

  map: {
    title: "Карта міста",
    subtitle: "Що досліджує ваша дитина",
    nothingTitle: "Поки що нічого немає",
    nothingBody: (levelName) =>
      `Для рівня ${levelName} ще не опубліковано жодного району. Вони з’являться тут, щойно місто розростеться.`,
    districtOf: (index, total) => `Район ${index} з ${total}`,
    previousDistrict: "Попередній район",
    nextDistrict: "Наступний район",
    completedBy: (who) => `✓ пройдено: ${who}`,
    missionsProgress: (completed, total) => `${completed}/${total} місій`,
    missionsCount: (count) => `${count} ${pluralSlavic(count, "місія", "місії", "місій")}`,
    noLocations: "У цьому районі ще немає опублікованих локацій.",
    loadingMap: "Завантажуємо карту…",
    selectedLocation: "Вибрана локація",
    earnedHere: "зароблено тут",
    toEarnHere: "можна заробити тут",
    openMissions: "▶ Відкрити місії",
    openLocation: "Відкрити локацію",
  },
};
