import type { AppSettings } from "../types";

export const SUBJECTS = [
  "סדר דין אזרחי",
  "סדר דין פלילי",
  "דיני ראיות",
  "דיני עונשין",
  "דיני קניין",
  "דיני חוזים",
  "דיני נזיקין",
  "דיני משפחה",
  "דיני ירושה",
  "אתיקה מקצועית",
  "משפט חוקתי",
  "משפט מנהלי",
  "דיני עבודה",
  "דיני תאגידים",
  "הוצאה לפועל",
  "חדלות פירעון",
  "מיסוי מקרקעין",
  "דיני בנקאות",
  "דיני בוררות",
  "דיני הגנת הצרכן",
  "תובענות ייצוגיות",
];

export const DEFAULT_SETTINGS: AppSettings = {
  learningDuration: 50,
  breakDuration: 10,
  personalDuration: 30,
  isCountdownMode: false,
  isPomodoroMode: false,
  pomodoroWork: 25,
  pomodoroBreak: 5,
};

export const STORAGE_KEYS = {
  SESSIONS: "pass_the_bar_sessions",
  SETTINGS: "pass_the_bar_settings",
} as const;
