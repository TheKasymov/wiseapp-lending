// wiseApp landing — runtime config.
// Меняйте здесь URL демо и git commit + push — деплой GitHub Pages подхватит автоматически.
window.WISEAPP_CONFIG = {
  // Адрес работающей версии приложения (без хвостового слэша).
  DEMO_URL: 'https://barrier-pretty-murmuring.ngrok-free.dev',

  // Путь health-check эндпоинта на демо-сервере.
  // Должен отдавать HTTP 200 при живом приложении.
  HEALTH_PATH: '/health',

  // Как часто перепроверять состояние (мс).
  CHECK_INTERVAL_MS: 30000,

  // Тайм-аут одного запроса /health (мс).
  CHECK_TIMEOUT_MS: 5000,
};
