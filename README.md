# wiseApp — Demo Day Landing

Лендинг wiseApp для демо-дня. Хостится на GitHub Pages, проверяет доступность демо через `GET /health` и реагирует UI/UX (баннер + дизейбл кнопок) если демо лежит.

## Структура

```
.
├── index.html              ← главная страница
├── landing.css             ← стили (расширяет colors_and_type)
├── colors_and_type.css     ← дизайн-токены wiseApp
├── config.js               ← URL демо (меняется здесь)
└── wiseapp-design-system/  ← оригинальный handoff-bundle (референс)
```

## Поменять URL демо

Открыть [`config.js`](config.js) и поправить одну строку:

```js
window.WISEAPP_CONFIG = {
  DEMO_URL: 'https://demo.wiseapp.kz',  // ← сюда
  HEALTH_PATH: '/health',
  CHECK_INTERVAL_MS: 30000,
  CHECK_TIMEOUT_MS: 5000,
};
```

Затем:
```bash
git add config.js
git commit -m "demo URL → new value"
git push
```

GitHub Pages подхватит изменение в течение ~30 секунд. Перезагрузить лендинг — новый URL уже активен.

## Как работает health-check

1. При загрузке страницы и каждые `CHECK_INTERVAL_MS` (по умолчанию 30 сек) делается `fetch(DEMO_URL + HEALTH_PATH)`.
2. Если ответ — `200 OK` → состояние **online**:
   - Статус-чип в шапке: `● Демо онлайн` (зелёный)
   - Все кнопки «Открыть демо / Войти / Action Center / P&L / Склад / Trust Score» активны и ведут на `DEMO_URL`.
3. Если запрос упал (сетевая ошибка, таймаут, не-200) → состояние **offline**:
   - Сверху появляется красный баннер «Демо временно недоступно…» с кнопкой «Проверить ещё раз»
   - Статус-чип: `● Демо оффлайн`
   - Все CTA становятся полупрозрачными и не кликаются.
4. При возврате на вкладку (`visibilitychange`) — внеочередная проверка.

### CORS

Браузер требует CORS-заголовок `Access-Control-Allow-Origin` на ответе `/health`, иначе fetch упадёт TypeError.

**Рекомендуется** на демо-сервере отдавать на `/health`:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/json
```

Если настроить CORS невозможно — скрипт автоматически уходит в **fallback на `mode: 'no-cors'`**. Тогда определяется только факт «сервер ответил / не ответил», без чтения статус-кода. Этого достаточно для базового мониторинга, но менее точно (5xx может быть распознан как online).

## Запуск локально

```bash
python -m http.server 8000
# открыть http://localhost:8000/
```

Откройте DevTools → Network — там видно периодические `GET /health`.

## Деплой на GitHub Pages

1. `git init && git add . && git commit -m "init landing"`
2. Создать репозиторий на GitHub и запушить:
   ```bash
   git remote add origin git@github.com:<user>/<repo>.git
   git branch -M main
   git push -u origin main
   ```
3. GitHub → **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. Через ~30 сек страница доступна на `https://<user>.github.io/<repo>/`.

## Дизайн-система

Все визуальные решения и обоснования: [`wiseapp-design-system/README.md`](wiseapp-design-system/README.md).
Кратко — Inter, slate-900 чернила, brand-500 (#f59e0b) только на CTA и акцентах, hairline borders, near-flat shadows, всё на русском.
