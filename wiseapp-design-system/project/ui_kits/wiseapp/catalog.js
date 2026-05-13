/* wiseApp catalog v2 — navigation logic
   - 4 missions in rail + system
   - contextual topbar (breadcrumbs + page-specific actions)
   - ⌘K palette as primary navigation across all 36 pages
   - sub-nav within page for related screens
*/

// ============ Page registry ============
// Mirrors real bizfocus sidebar groups, collapsed into 4 missions.
// Each entry: { id, label, mission, group, aliases, related[] }
window.WA_PAGES = [
  // Сегодня — what you need right now
  { id: 'dashboard',    label: 'Dashboard',              mission: 'today', group: 'Обзор',     aliases: ['главная', 'overview', 'home'] },
  { id: 'cockpit',      label: 'Cockpit менеджера',      mission: 'today', group: 'Обзор',     aliases: ['оперативный', 'realtime', 'смена'] },
  { id: 'action-center',label: 'Action Center',          mission: 'today', group: 'Обзор',     aliases: ['задачи', 'алерты', 'tasks', 'inbox'] },
  { id: 'anomalies',    label: 'Аномалии',               mission: 'today', group: 'Безопасность', aliases: ['anomaly', 'отклонения', 'z-score'] },
  { id: 'recommendations', label: 'AI рекомендации',     mission: 'today', group: 'Клиенты',   aliases: ['recommend', 'ai', 'suggest'] },

  // Аналитика — understanding the past
  { id: 'heatmap',      label: 'Тепловая карта спроса',  mission: 'analytics', group: 'Аналитика', aliases: ['heatmap', 'часы', 'дни'] },
  { id: 'cohorts',      label: 'Когорты & RFM',          mission: 'analytics', group: 'Аналитика', aliases: ['cohort', 'retention', 'rfm', 'клиенты'] },
  { id: 'funnel',       label: 'Воронка продаж',         mission: 'analytics', group: 'Аналитика', aliases: ['funnel', 'конверсия'] },
  { id: 'abc',          label: 'ABC / XYZ анализ',       mission: 'analytics', group: 'Аналитика', aliases: ['abc', 'xyz', 'pareto'] },
  { id: 'products',     label: 'Анализ товаров',         mission: 'analytics', group: 'Аналитика', aliases: ['товары', 'products', 'menu'] },
  { id: 'staff-perf',   label: 'Эффективность сотрудников', mission: 'analytics', group: 'Аналитика', aliases: ['staff', 'персонал', 'leaderboard'] },
  { id: 'weather',      label: 'Влияние погоды',         mission: 'analytics', group: 'Аналитика', aliases: ['weather', 'погода'] },
  { id: 'holidays',     label: 'Календарь праздников',   mission: 'analytics', group: 'Аналитика', aliases: ['holidays', 'праздники'] },
  { id: 'reviews',      label: 'Отзывы и рейтинги',      mission: 'analytics', group: 'Клиенты',   aliases: ['reviews', 'отзывы', '2gis', 'google'] },
  { id: 'loyalty',      label: 'Программа лояльности',   mission: 'analytics', group: 'Клиенты',   aliases: ['loyalty', 'лояльность', 'клуб'] },
  { id: 'benchmarking', label: 'Бенчмаркинг',            mission: 'analytics', group: 'Финансы',   aliases: ['benchmark', 'сравнение', 'рынок'] },

  // Деньги — money flows
  { id: 'pl',           label: 'P&L отчёт',              mission: 'money',    group: 'Финансы',   aliases: ['p&l', 'pnl', 'profit', 'отчёт о прибыли'] },
  { id: 'cashflow',     label: 'Кассовые разрывы',       mission: 'money',    group: 'Финансы',   aliases: ['cash', 'gap', 'разрыв', 'liquidity'] },
  { id: 'food-cost',    label: 'Food Cost',              mission: 'money',    group: 'Финансы',   aliases: ['foodcost', 'себестоимость', 'cogs'] },
  { id: 'finances',     label: 'Финансовая аналитика',   mission: 'money',    group: 'Финансы',   aliases: ['finance', 'выручка', 'revenue'] },
  { id: 'z-reports',    label: 'Z-отчёты',               mission: 'money',    group: 'Персонал',  aliases: ['z-report', 'смены', 'кассир'] },

  // Операции — running the business
  { id: 'inventory',    label: 'Складской учёт',         mission: 'ops',      group: 'Операции',  aliases: ['inventory', 'склад', 'остатки', 'warehouse'] },
  { id: 'movements',    label: 'Движения товаров',       mission: 'ops',      group: 'Операции',  aliases: ['movements', 'движения', 'transfer'] },
  { id: 'smart-inv',    label: 'Умная инвентаризация',   mission: 'ops',      group: 'Операции',  aliases: ['smart inventory', 'аудит'] },
  { id: 'recipes',      label: 'Рецепты и ТТК',          mission: 'ops',      group: 'Операции',  aliases: ['recipes', 'рецепты', 'ттк'] },
  { id: 'shifts',       label: 'Сменный график',         mission: 'ops',      group: 'Персонал',  aliases: ['shifts', 'график', 'rota'] },
  { id: 'fraud',        label: 'Фрод-детектор',          mission: 'ops',      group: 'Безопасность', aliases: ['fraud', 'фрод', 'воровство'] },
  { id: 'trust-score',  label: 'Trust Score сотрудников', mission: 'ops',     group: 'Безопасность', aliases: ['trust', 'рейтинг', 'честность'] },

  // Система — settings & integrations
  { id: 'profile',      label: 'Профиль',                mission: 'system',   group: 'Система',   aliases: ['profile', 'аккаунт'] },
  { id: 'team',         label: 'Команда',                mission: 'system',   group: 'Система',   aliases: ['team', 'roles', 'роли'] },
  { id: 'restaurants',  label: 'Рестораны',              mission: 'system',   group: 'Система',   aliases: ['restaurants', 'точки', 'локации'] },
  { id: 'iiko',         label: 'iiko интеграция',        mission: 'system',   group: 'Система',   aliases: ['iiko', 'интеграция', 'pos'] },
  { id: 'import',       label: 'Импорт CSV / Excel',     mission: 'system',   group: 'Система',   aliases: ['import', 'импорт', 'csv', 'excel'] },
  { id: 'auth-login',   label: 'Auth · Login',           mission: 'system',   group: 'Система',   aliases: ['login', 'вход'] },
  { id: 'auth-register',label: 'Auth · Register',        mission: 'system',   group: 'Система',   aliases: ['register', 'регистрация'] },
  { id: 'auth-reset',   label: 'Auth · Reset password',  mission: 'system',   group: 'Система',   aliases: ['reset', 'сброс', 'пароль'] },
];

window.WA_MISSIONS = {
  today:     { label: 'Сегодня',  short: 'Сегодня' },
  analytics: { label: 'Аналитика', short: 'Аналитика' },
  money:     { label: 'Деньги',    short: 'Деньги' },
  ops:       { label: 'Операции',  short: 'Операции' },
  system:    { label: 'Система',   short: 'Система' },
};

// Sub-nav contracts: which related pages are pinned to a given page's header.
// Mirrors how real users move between adjacent screens.
window.WA_SUBNAV = {
  // money cluster
  'pl':         ['pl', 'food-cost', 'benchmarking', 'finances'],
  'food-cost':  ['pl', 'food-cost', 'benchmarking', 'finances'],
  'benchmarking': ['pl', 'food-cost', 'benchmarking', 'finances'],
  'finances':   ['pl', 'food-cost', 'benchmarking', 'finances'],
  'cashflow':   ['cashflow', 'pl', 'finances'],

  // ops cluster
  'inventory':  ['inventory', 'movements', 'smart-inv', 'recipes'],
  'movements':  ['inventory', 'movements', 'smart-inv', 'recipes'],
  'smart-inv':  ['inventory', 'movements', 'smart-inv', 'recipes'],
  'recipes':    ['inventory', 'movements', 'smart-inv', 'recipes'],

  // safety cluster
  'anomalies':  ['anomalies', 'fraud', 'trust-score'],
  'fraud':      ['anomalies', 'fraud', 'trust-score'],
  'trust-score':['anomalies', 'fraud', 'trust-score'],

  // people cluster
  'staff-perf': ['staff-perf', 'shifts', 'z-reports', 'trust-score'],
  'shifts':     ['staff-perf', 'shifts', 'z-reports', 'trust-score'],
  'z-reports':  ['staff-perf', 'shifts', 'z-reports', 'trust-score'],

  // customer cluster
  'cohorts':    ['cohorts', 'loyalty', 'reviews', 'recommendations'],
  'loyalty':    ['cohorts', 'loyalty', 'reviews', 'recommendations'],
  'reviews':    ['cohorts', 'loyalty', 'reviews', 'recommendations'],
  'recommendations': ['cohorts', 'loyalty', 'reviews', 'recommendations'],

  // analytics cluster
  'heatmap':    ['heatmap', 'weather', 'holidays'],
  'weather':    ['heatmap', 'weather', 'holidays'],
  'holidays':   ['heatmap', 'weather', 'holidays'],

  // overview cluster
  'dashboard':  ['dashboard', 'cockpit', 'action-center'],
  'cockpit':    ['dashboard', 'cockpit', 'action-center'],
  'action-center': ['dashboard', 'cockpit', 'action-center'],

  // products
  'abc':        ['products', 'abc', 'funnel'],
  'products':   ['products', 'abc', 'funnel'],
  'funnel':     ['products', 'abc', 'funnel'],

  // system
  'profile':    ['profile', 'team', 'restaurants', 'iiko', 'import'],
  'team':       ['profile', 'team', 'restaurants', 'iiko', 'import'],
  'restaurants':['profile', 'team', 'restaurants', 'iiko', 'import'],
  'iiko':       ['profile', 'team', 'restaurants', 'iiko', 'import'],
  'import':     ['profile', 'team', 'restaurants', 'iiko', 'import'],

  // auth (no subnav — standalone)
};

// ============ Wiring ============
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const PAGES_BY_ID = Object.fromEntries(WA_PAGES.map(p => [p.id, p]));

// Show a page (id). Updates rail mission, topbar, sub-nav, and page visibility.
function showPage(id) {
  const page = PAGES_BY_ID[id];
  if (!page) return;

  // page visibility
  $$('.page').forEach(el => el.classList.toggle('hidden', el.id !== `page-${id}`));

  // rail mission active
  $$('.rail-item.mission').forEach(el => el.classList.toggle('active', el.dataset.mission === page.mission));

  // topbar breadcrumb
  const cr = $('#crumbs');
  if (cr) {
    cr.innerHTML = `
      <span class="mission">${WA_MISSIONS[page.mission].label}</span>
      <span class="sep">/</span>
      <span class="page">${page.label}</span>
    `;
  }

  // sub-nav rendering inside the page header
  const subnavIds = WA_SUBNAV[id];
  const headHost = $(`#page-${id} .subnav-host`);
  if (headHost) {
    if (subnavIds && subnavIds.length > 1) {
      headHost.innerHTML = `<div class="subnav">${subnavIds.map(sid => {
        const p = PAGES_BY_ID[sid];
        if (!p) return '';
        return `<button class="${sid===id?'on':''}" data-go="${sid}">${p.label}</button>`;
      }).join('')}</div>`;
      headHost.style.display = '';
    } else {
      headHost.innerHTML = '';
      headHost.style.display = 'none';
    }
  }

  // remember
  try { sessionStorage.setItem('wa-last-page', id); } catch(e) {}

  // hash for shareable link
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);

  // re-render lucide icons in the now-visible page
  if (window.lucide && lucide.createIcons) lucide.createIcons();

  // scroll to top of main
  const main = $('.main');
  if (main) main.scrollTop = 0;
}

// Mission click → open the first page of that mission
function showMission(missionId) {
  const first = WA_PAGES.find(p => p.mission === missionId);
  if (first) showPage(first.id);
}

// ============ Command palette ============
let cmdSel = 0;
let cmdResults = [];

function openCmd() {
  const bg = $('#cmd-bg');
  bg.classList.add('open');
  const inp = $('#cmd-input');
  inp.value = '';
  renderCmd('');
  setTimeout(() => inp.focus(), 30);
}
function closeCmd() {
  $('#cmd-bg').classList.remove('open');
}

function searchPages(q) {
  q = q.trim().toLowerCase();
  if (!q) return WA_PAGES.slice();
  return WA_PAGES.filter(p => {
    const hay = (p.label + ' ' + p.group + ' ' + (p.aliases||[]).join(' ')).toLowerCase();
    return hay.includes(q);
  });
}

function renderCmd(q) {
  cmdResults = searchPages(q);
  cmdSel = 0;
  const list = $('#cmd-list');
  if (!cmdResults.length) {
    list.innerHTML = `<div style="padding:24px;text-align:center;color:var(--slate-400);font-size:13px;">Ничего не найдено</div>`;
    return;
  }
  // group by mission
  const byMission = {};
  cmdResults.forEach(p => {
    (byMission[p.mission] = byMission[p.mission] || []).push(p);
  });
  let html = '';
  let idx = 0;
  Object.entries(byMission).forEach(([mid, items]) => {
    html += `<div class="cmd-section">${WA_MISSIONS[mid].label}</div>`;
    items.forEach(p => {
      html += `<div class="cmd-row${idx===0?' on':''}" data-idx="${idx}" data-go="${p.id}">
        <i class="lc" data-lucide="corner-down-right"></i>
        <div class="label">${p.label}</div>
        <div class="crumb">${p.group}</div>
      </div>`;
      idx++;
    });
  });
  list.innerHTML = html;
  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function moveCmdSel(d) {
  const rows = $$('.cmd-row');
  if (!rows.length) return;
  cmdSel = (cmdSel + d + rows.length) % rows.length;
  rows.forEach(r => r.classList.toggle('on', +r.dataset.idx === cmdSel));
  rows[cmdSel].scrollIntoViewIfNeeded ? rows[cmdSel].scrollIntoViewIfNeeded() : rows[cmdSel].scrollIntoView({block:'nearest'});
}

function activateCmdSel() {
  const row = $$('.cmd-row')[cmdSel];
  if (row) {
    showPage(row.dataset.go);
    closeCmd();
  }
}

// ============ Density ============
function setDensity(d) {
  document.documentElement.dataset.density = d;
  $$('.density-toggle button').forEach(b => b.classList.toggle('on', b.dataset.density === d));
  try { localStorage.setItem('wa-density', d); } catch(e) {}
}

// ============ Drawer ============
function openDrawer(id) {
  const dr = $(`#${id}`);
  const bg = $('#drawer-bg');
  if (!dr || !bg) return;
  dr.classList.add('open');
  bg.classList.add('open');
}
function closeDrawer() {
  $$('.drawer').forEach(d => d.classList.remove('open'));
  $('#drawer-bg').classList.remove('open');
}

// ============ Boot ============
document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons
  if (window.lucide && lucide.createIcons) lucide.createIcons();

  // Density restore
  let d = 'comfortable';
  try { d = localStorage.getItem('wa-density') || 'comfortable'; } catch(e) {}
  setDensity(d);
  $$('.density-toggle button').forEach(b => b.addEventListener('click', () => setDensity(b.dataset.density)));

  // Rail mission clicks
  $$('.rail-item.mission').forEach(el => {
    el.addEventListener('click', () => showMission(el.dataset.mission));
  });

  // Rail system + cmd
  const cmdBtn = $('#open-cmd-rail');
  if (cmdBtn) cmdBtn.addEventListener('click', openCmd);

  // Topbar cmd button
  const cmdTop = $('#cmd-trigger');
  if (cmdTop) cmdTop.addEventListener('click', openCmd);

  // Delegated nav clicks (cmd palette rows + sub-nav buttons + any data-go)
  document.addEventListener('click', (e) => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) {
      e.preventDefault();
      showPage(goEl.dataset.go);
      closeCmd();
      return;
    }
    const drBtn = e.target.closest('[data-drawer]');
    if (drBtn) {
      e.preventDefault();
      openDrawer(drBtn.dataset.drawer);
      return;
    }
    const drClose = e.target.closest('[data-drawer-close]');
    if (drClose) {
      closeDrawer();
      return;
    }
  });

  // Drawer bg
  $('#drawer-bg')?.addEventListener('click', closeDrawer);

  // Cmd input
  const inp = $('#cmd-input');
  if (inp) {
    inp.addEventListener('input', () => renderCmd(inp.value));
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveCmdSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveCmdSel(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); activateCmdSel(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeCmd(); }
    });
  }
  // Clicking outside cmd panel closes it
  $('#cmd-bg')?.addEventListener('click', (e) => {
    if (e.target.id === 'cmd-bg') closeCmd();
  });

  // Hover row in cmd updates selection
  document.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.cmd-row');
    if (row) {
      const idx = +row.dataset.idx;
      if (idx !== cmdSel) {
        cmdSel = idx;
        $$('.cmd-row').forEach(r => r.classList.toggle('on', +r.dataset.idx === cmdSel));
      }
    }
  });

  // Global ⌘K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCmd();
    } else if (e.key === 'Escape') {
      closeCmd();
      closeDrawer();
    }
  });

  // Initial page from hash, then last session, then dashboard
  const fromHash = (location.hash || '').replace('#', '');
  let initial = 'dashboard';
  if (fromHash && PAGES_BY_ID[fromHash]) initial = fromHash;
  else {
    try {
      const last = sessionStorage.getItem('wa-last-page');
      if (last && PAGES_BY_ID[last]) initial = last;
    } catch(e) {}
  }
  showPage(initial);
});
