export const CONNECTION_PLACEHOLDER = {
  CONNECTION: "Подключение...",
  CONNECTED: "Соединение установлено",
  FAILED: "⚠️ Потеря соединения",
  CLOSED: "❌ Соединение закрыто",
} as const;

export type ConnectionPlaceholder = typeof CONNECTION_PLACEHOLDER[keyof typeof CONNECTION_PLACEHOLDER];

export const CAMERA_MODE = {
  USER: "user",
  ENV: "environment",
} as const;

export type CameraMode = typeof CAMERA_MODE[keyof typeof CAMERA_MODE];
