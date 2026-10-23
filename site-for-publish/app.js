const STORE = 'kotik-health-notes-v1';
const THEME = 'kotik-health-theme-v1';
const DIARY_STORE = 'kotik-health-diary-v1';
const NEXT_VISIT_STORE = 'kotik-next-visit-v1';
const CLINIC_FAVORITES_STORE = 'kotik-clinic-favorites-v1';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
let notes = readNotes();
let diaryEntries = readDiary();
let favoriteClinics = readClinicFavorites();
let clinicFavoritesOnly = false;
let toastTimer;
let greetingTimer;

const CLINICS = [
  {
    id: 'gp1', name: 'Городская поликлиника №1', type: 'polyclinic', tags: ['polyclinic'],
    address: 'ул. М. Ауэзова, 130', phone: '+7 (7152) 52-70-13', tel: '+77152527013',
    official: 'https://www.gov.kz/article/740?lang=ru', officialLabel: 'Контакты на gov.kz',
    note: 'Позвони в регистратуру, чтобы уточнить запись и расписание.', book: true
  },
  {
    id: 'gp2', name: 'Городская поликлиника №2', type: 'polyclinic', tags: ['polyclinic'],
    address: 'ул. Васильева, 123', phone: '+7 (7152) 50-27-23', tel: '+77152502723',
    official: 'https://2gorpol.kz/ru/', officialLabel: 'Официальный сайт',
    note: 'На сайте есть услуги eGov: запись к врачу, прикрепление и вызов врача на дом.', book: true
  },
  {
    id: 'gp3', name: 'Городская поликлиника №3', type: 'polyclinic', tags: ['polyclinic'],
    address: 'ул. Ж. Кизатова, 7А', phone: '+7 (7152) 63-01-55', tel: '+77152630155',
    official: 'https://poliklinika.sko.kz/', officialLabel: 'Официальный сайт',
    note: 'Уточни по телефону, в каком филиале принимает нужный специалист.', book: true
  },
  {
    id: 'regional', name: 'Многопрофильная областная больница', type: 'hospital', tags: ['hospital'],
    address: 'ул. Брусиловского, 20', phone: '+7 (7152) 63-03-80', tel: '+77152630380',
    official: 'https://ob.sko.kz/ob.sko.kz/page/read/contacts2139.html?lang=ru', officialLabel: 'Контакты и запись',
    note: 'Ещё один номер регистратуры: +7 (7152) 63-01-09. Для записи звонки принимают в будни с 08:00 до 17:00; уточни, нужен ли маршрут.', book: false
  },
  {
    id: 'first-city', name: 'Первая городская больница', type: 'hospital', tags: ['hospital'],
    address: 'ул. Сатпаева, 3', phone: '+7 (7152) 38-03-40', tel: '+77152380340',
    official: 'https://www.gov.kz/article/685?lang=ru', officialLabel: 'Государственный список контактов',
    note: 'Позвони и уточни, принимает ли нужное отделение амбулаторно и как записаться.', book: false
  },
  {
    id: 'city-emergency', name: 'Многопрофильная городская больница скорой медицинской помощи', type: 'hospital', tags: ['hospital'],
    address: 'ул. Тауфика Мухамед-Рахимова, 27', phone: '+7 (7152) 50-07-22', tel: '+77152500722',
    official: 'https://www.kbka.sko.kz/ru/', officialLabel: 'Официальный сайт',
    note: 'Больница оказывает круглосуточную помощь. Для плановой консультации сначала уточни порядок по телефону.', book: false
  },
  {
    id: 'children', name: 'Многопрофильная детская областная больница', type: 'hospital', tags: ['hospital', 'children'],
    address: 'ул. Пушкина, 23', phone: '+7 (7152) 63-02-04', tel: '+77152630204',
    official: 'https://mdob.kz/kontakty/', officialLabel: 'Контакты и консультативный центр',
    note: 'Детская плановая консультация: позвони в консультативно-диагностический центр и уточни порядок приёма.', book: false
  },
  {
    id: 'dental', name: 'Областная стоматологическая поликлиника', type: 'dental', tags: ['dental'],
    address: 'ул. Абая, 43', phone: '+7 (7152) 46-75-94', tel: '+77152467594',
    official: 'https://www.gov.kz/article/740?lang=ru', officialLabel: 'Контакты на gov.kz',
    note: 'Порядок записи и часы приёма уточни по телефону.', book: false
  }
];

const MEDICAL_GLOSSARY = [
  { terms: [/УЗИ/i, /ультразвуков(ое|ого) исследован/i], title: 'УЗИ', meaning: 'Исследование, при котором изображение органов получают с помощью ультразвуковых волн.' },
  { terms: [/(?:^|[^А-ЯЁа-яё])МРТ(?:$|[^А-ЯЁа-яё])/i, /магнитно-резонансн/i], title: 'МРТ', meaning: 'Исследование, которое создаёт подробные изображения внутренних структур с помощью магнитного поля и радиоволн.' },
  { terms: [/(?:^|[^А-ЯЁа-яё])КТ(?:$|[^А-ЯЁа-яё])/i, /компьютерн(ая|ой) томограф/i], title: 'КТ', meaning: 'Исследование, которое собирает изображения внутренних органов с помощью рентгеновских снимков и компьютера.' },
  { terms: [/общ(?:ий анализ крови|его анализа крови)/i], title: 'Общий анализ крови', meaning: 'Лабораторное исследование клеток крови и некоторых их показателей. Сам по себе результат не объясняет причину изменений.' },
  { terms: [/референсн.{0,30}(интервал|диапазон|значени)|норм.{0,20}лаборатор/i], title: 'Референсный интервал', meaning: 'Диапазон значений, с которым лаборатория сравнивает результат. Он зависит от метода исследования и сам по себе не заменяет оценку врача.' },
  { terms: [/гемоглобин/i], title: 'Гемоглобин', meaning: 'Белок в эритроцитах, который переносит кислород. Результат оценивают вместе с другими показателями и обстоятельствами.' },
  { terms: [/эритроцит/i], title: 'Эритроциты', meaning: 'Красные клетки крови, которые переносят кислород с помощью гемоглобина.' },
  { terms: [/лейкоцит/i], title: 'Лейкоциты', meaning: 'Клетки крови, участвующие в защите организма. Их количество само по себе не устанавливает причину изменений.' },
  { terms: [/тромбоцит/i], title: 'Тромбоциты', meaning: 'Клетки крови, которые участвуют в остановке кровотечения и свёртывании крови.' },
  { terms: [/глюкоз/i], title: 'Глюкоза', meaning: 'Одна из форм сахара в крови и важный источник энергии для организма. Значение результата зависит от условий сдачи анализа и референсного интервала.' },
  { terms: [/(?:^|[^А-ЯЁа-яё])ЭКГ(?:$|[^А-ЯЁа-яё])/i, /электрокардиограмм/i], title: 'ЭКГ', meaning: 'Запись электрической активности сердца с помощью электродов на коже.' },
  { terms: [/хроническ/i], title: 'Хронический', meaning: 'Обычно так описывают состояние, которое длится долго или может возвращаться. Само слово не говорит о тяжести.' },
  { terms: [/остр(?:ый|ая|ое|ого|ой|ом|ые|ых)/i], title: 'Острый', meaning: 'Так могут описывать состояние, которое возникло недавно или проявляется выраженно. Точный смысл зависит от фразы и объяснения врача.' },
  { terms: [/ремисси/i], title: 'Ремиссия', meaning: 'Период, когда проявления заболевания уменьшились или не заметны. Это не всегда означает, что состояние окончательно прошло.' },
  { terms: [/биопси/i], title: 'Биопсия', meaning: 'Получение небольшого образца ткани для лабораторного исследования.' },
  { terms: [/анеми/i], title: 'Анемия', meaning: 'Состояние, при котором снижены гемоглобин и/или показатели эритроцитов. Причины бывают разными — их оценивает врач.' },
  { terms: [/воспалени/i], title: 'Воспаление', meaning: 'Реакция организма на повреждение или раздражитель. Это описание процесса, а не указание одной конкретной причины.' },
  { terms: [/гипертони/i, /артериальн(ое|ого) давлени/i], title: 'Артериальное давление / гипертония', meaning: 'Артериальное давление — сила, с которой кровь действует на стенки сосудов. Гипертония означает устойчивое повышение давления; диагноз определяет врач по повторным измерениям и другим данным.' },
  { terms: [/гипотони/i], title: 'Гипотония', meaning: 'Так называют пониженное артериальное давление; значение и важность результата врач оценивает с учётом самочувствия и повторных измерений.' },
  { terms: [/натощак/i], title: 'Натощак', meaning: 'Обычно означает, что перед исследованием нужно не есть определённое время. Сколько именно и можно ли пить воду — уточни у клиники.' },
  { terms: [/метастаз/i], title: 'Метастазы', meaning: 'Распространение клеток злокачественной опухоли из исходного очага в другие части тела. Значение конкретного результата должен объяснить лечащий специалист.' },
  { terms: [/доброкачествен/i], title: 'Доброкачественный', meaning: 'Обычно описывает образование, которое не ведёт себя как злокачественная опухоль. Важны тип образования и контекст заключения.' },
  { terms: [/злокачествен/i], title: 'Злокачественный', meaning: 'Так описывают опухоль, клетки которой могут прорастать в окружающие ткани и распространяться. Не делай вывод по одному слову — попроси врача разобрать заключение полностью.' },
  { terms: [/биохими(ческий|я) анализ/i], title: 'Биохимический анализ', meaning: 'Группа лабораторных измерений веществ в крови. Какие показатели важны, зависит от цели исследования.' },
  { terms: [/ферритин/i], title: 'Ферритин', meaning: 'Белок, который запасает железо. Анализ крови на ферритин помогает оценить запасы железа, но один показатель не объясняет причину отклонения и не подсказывает лечение.', source: 'https://medlineplus.gov/lab-tests/ferritin-blood-test/' },
  { terms: [/креатинин/i], title: 'Креатинин', meaning: 'Продукт обмена, который образуется в мышцах и выводится почками. Врач оценивает результат вместе с другими данными: одного значения недостаточно, чтобы определить состояние почек.', source: 'https://medlineplus.gov/lab-tests/creatinine-test/' },
  { terms: [/(?:^|[^А-ЯЁа-яё])ТТГ(?:$|[^А-ЯЁа-яё])/i, /тиреотропн/i], title: 'ТТГ', meaning: 'Гормон, который помогает регулировать работу щитовидной железы. Анализ измеряет его уровень в крови, но сам по себе не объясняет причину результата.', source: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/' },
  { terms: [/с-реактивн.{0,20}белок/i, /(?:^|[^А-ЯЁа-яё])СРБ(?:$|[^А-ЯЁа-яё])/i, /(?:^|[^A-Za-z])CRP(?:$|[^A-Za-z])/i], title: 'С-реактивный белок (СРБ, CRP)', meaning: 'Белок, уровень которого может повышаться при воспалении. Анализ не указывает сам по себе, где находится воспаление и чем оно вызвано.', source: 'https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/' },
  { terms: [/общ.{0,12}анализ мочи/i, /уринализ/i], title: 'Общий анализ мочи', meaning: 'Исследование образца мочи: оценивают его свойства и проверяют наличие некоторых веществ, клеток и других признаков. Результат зависит также от правильного сбора образца.', source: 'https://medlineplus.gov/urinalysis.html' },
  { terms: [/липидн.{0,15}профил/i, /липидограмм/i, /холестерин/i], title: 'Липидный профиль', meaning: 'Группа анализов крови, в которую могут входить холестерин и триглицериды. Врач рассматривает показатели вместе с другими факторами здоровья.', source: 'https://medlineplus.gov/lab-tests/cholesterol-levels/' },
  { terms: [/(?:^|[^A-Za-z])eGFR(?:$|[^A-Za-z])/i, /скорост.{0,30}клубочков.{0,20}фильтрац/i], title: 'рСКФ (eGFR)', meaning: 'Расчётная оценка того, как почки фильтруют кровь. Её рассчитывают по лабораторным данным и другим сведениям; это не самостоятельный диагноз.', source: 'https://medlineplus.gov/lab-tests/estimated-glomerular-filtration-rate-egfr-and-gfr-tests/' },
  { terms: [/гликированн.{0,20}гемоглобин/i, /(?:^|[^A-Za-z])HbA1c(?:$|[^A-Za-z])/i], title: 'Гликированный гемоглобин (HbA1c)', meaning: 'Анализ крови, который помогает оценить средний уровень глюкозы примерно за последние три месяца. Результат нужно обсуждать с врачом в контексте других данных.', source: 'https://medlineplus.gov/lab-tests/diabetes-tests/' }
];

const GLOSSARY_EXAMS = new Set(['УЗИ', 'МРТ', 'КТ', 'ЭКГ', 'Биопсия']);
const GLOSSARY_LABS = new Set(['Общий анализ крови', 'Референсный интервал', 'Гемоглобин', 'Эритроциты', 'Лейкоциты', 'Тромбоциты', 'Глюкоза', 'Биохимический анализ', 'Ферритин', 'Креатинин', 'ТТГ', 'С-реактивный белок (СРБ, CRP)', 'Общий анализ мочи', 'Липидный профиль', 'рСКФ (eGFR)', 'Гликированный гемоглобин (HbA1c)']);
let glossaryFilter = 'all';

function pluralize(number, one, few, many) {
  const value = Math.abs(number) % 100;
  const lastDigit = value % 10;
  if (value > 10 && value < 20) return many;
  if (lastDigit > 1 && lastDigit < 5) return few;
  if (lastDigit === 1) return one;
  return many;
}

function glossaryCategory(entry) {
  if (GLOSSARY_EXAMS.has(entry.title)) return { id: 'exams', label: 'Обследование' };
  if (GLOSSARY_LABS.has(entry.title)) return { id: 'labs', label: 'Анализы и показатели' };
  return { id: 'terms', label: 'Медицинское слово' };
}

function renderGlossary() {
  const query = ($('#glossarySearch')?.value || '').trim().toLocaleLowerCase('ru-RU');
  const entries = MEDICAL_GLOSSARY.filter(entry => {
    const matchesText = !query || `${entry.title} ${entry.meaning}`.toLocaleLowerCase('ru-RU').includes(query);
    const matchesCategory = glossaryFilter === 'all' || glossaryCategory(entry).id === glossaryFilter;
    return matchesText && matchesCategory;
  });

  $('#glossaryTotal').textContent = `${MEDICAL_GLOSSARY.length} ${pluralize(MEDICAL_GLOSSARY.length, 'понятное слово', 'понятных слова', 'понятных слов')}`;
  $('#glossaryCount').textContent = query || glossaryFilter !== 'all'
    ? `Найдено: ${entries.length} ${pluralize(entries.length, 'объяснение', 'объяснения', 'объяснений')}`
    : `Все объяснения · ${entries.length}`;

  $('#glossaryGrid').innerHTML = entries.length
    ? entries.map(entry => {
      const category = glossaryCategory(entry);
      return `<article class="glossary-card glossary-${category.id}">
        <div class="glossary-card-top"><span class="glossary-category">${category.label}</span><span class="glossary-sparkle">✦</span></div>
        <h2>${escapeHtml(entry.title)}</h2>
        <p>${escapeHtml(entry.meaning)}</p>
        ${entry.source ? `<a class="glossary-source" href="${escapeHtml(entry.source)}" target="_blank" rel="noopener">Источник и подробнее ↗</a>` : ''}
        <div class="glossary-card-note"><span>🐾</span> Точное значение уточни в контексте у врача</div>
      </article>`;
    }).join('')
    : '<div class="empty-state glossary-empty"><b>Пока такого слова нет</b>Попробуй другое написание или спроси врача, что означает этот термин именно в твоём заключении.</div>';
}

function readClinicFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(CLINIC_FAVORITES_STORE) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readNotes() {
  try {
    const value = JSON.parse(localStorage.getItem(STORE) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readDiary() {
  try {
    const value = JSON.parse(localStorage.getItem(DIARY_STORE) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function persistDiary() {
  try {
    localStorage.setItem(DIARY_STORE, JSON.stringify(diaryEntries));
    renderDiary();
  } catch {
    showToast('Не удалось сохранить. Проверь, включено ли хранилище браузера.');
  }
}

function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(notes));
    $$('.save-status').forEach(el => el.innerHTML = '<i></i> Сохранено');
    renderNotes();
  } catch {
    showToast('Не удалось сохранить. Проверь, включено ли хранилище браузера.');
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function showToast(message) {
  const box = $('#toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
}

function formatDate(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatDay(day) {
  if (!day) return '';
  const date = new Date(`${day}T12:00:00`);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
}

function localDateString(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function sortedDiaryEntries() {
  return [...diaryEntries].sort((a, b) =>
    b.date.localeCompare(a.date) || (b.created || '').localeCompare(a.created || '')
  );
}

function renderDiary() {
  const count = $('#diaryCount');
  const list = $('#diaryEntries');
  if (!count || !list) return;

  count.textContent = diaryEntries.length;
  list.innerHTML = diaryEntries.length
    ? sortedDiaryEntries().map(entry => `
      <article class="diary-entry">
        <div class="diary-entry-date"><span>ЗАПИСЬ</span><b>${escapeHtml(formatDay(entry.date))}</b></div>
        <div class="diary-entry-copy">
          <span class="impact-tag">${escapeHtml(entry.impact)}</span>
          <p>${escapeHtml(entry.observation)}</p>
          ${entry.context ? `<small>Контекст: ${escapeHtml(entry.context)}</small>` : ''}
        </div>
        <button class="entry-delete" type="button" aria-label="Удалить наблюдение" data-delete-diary="${escapeHtml(entry.id)}">×</button>
      </article>`).join('')
    : '<div class="empty-state"><b>Дневник пока пуст</b>Добавь наблюдение, если хочешь сохранить подробности к следующему визиту.</div>';
}

function renderNextVisit() {
  const card = $('#nextVisitCard');
  if (!card) return;

  let savedDate = '';
  try { savedDate = localStorage.getItem(NEXT_VISIT_STORE) || ''; } catch {}
  if (!savedDate) {
    card.classList.add('hidden');
    return;
  }

  const isPast = savedDate < localDateString();
  card.innerHTML = `
    <span class="next-visit-icon">◷</span>
    <div><span class="eyebrow">СЛЕДУЮЩИЙ ПРИЁМ</span>
      <b>${escapeHtml(formatDay(savedDate))}</b>
      <small>${isPast ? 'Дата уже прошла — при необходимости обнови её в записи после приёма.' : 'Дата сохранена на этом устройстве.'}</small>
    </div>
    <button type="button" id="clearNextVisit" aria-label="Убрать дату следующего приёма">×</button>`;
  card.classList.remove('hidden');
  $('#clearNextVisit').onclick = () => {
    localStorage.removeItem(NEXT_VISIT_STORE);
    renderNextVisit();
    showToast('Напоминание о дате удалено');
  };
}

function addNote(type, title, body, extra = {}) {
  notes.unshift({
    id: crypto.randomUUID?.() || String(Date.now()),
    type,
    title,
    body,
    created: new Date().toISOString(),
    ...extra
  });
  persist();
}

function renderNotes() {
  $('#noteCount').textContent = notes.length;

  const empty = '<div class="empty-state"><b>Пока нет заметок</b>Сохрани наблюдение, вопросы или итог приёма — и они появятся здесь.</div>';

  $('#homeNotes').innerHTML = notes.length
    ? notes.slice(0, 3).map(note => `
      <article class="note-row">
        <div class="note-date">
          <strong>${new Date(note.created).getDate()}</strong>
          ${new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(note.created))}
        </div>
        <div class="note-content">
          <b>${escapeHtml(note.title)}</b>
          <p>${escapeHtml(note.body)}</p>
        </div>
        <span class="note-tag">${note.type === 'prepare' ? 'Приём' : note.type === 'after' ? 'Итог приёма' : note.type === 'diary' ? 'Дневник' : 'Разбор'}</span>
      </article>`).join('')
    : empty;

  $('#allNotes').innerHTML = notes.length
    ? notes.map(note => `
      <article class="full-note">
        <header><b>${escapeHtml(note.title)}</b><time>${formatDate(note.created)}</time></header>
        <p>${escapeHtml(note.body)}</p>
        <div class="note-tools">
          <button data-download-note="${escapeHtml(note.id)}">Скачать заметку</button>
          <button data-delete-note="${escapeHtml(note.id)}">Удалить</button>
        </div>
      </article>`).join('')
    : empty;
}

function renderClinics() {
  const query = ($('#clinicSearch')?.value || '').trim().toLocaleLowerCase('ru');
  const type = $('#clinicType')?.value || 'all';
  const filtered = CLINICS.filter(clinic => {
    const searchable = `${clinic.name} ${clinic.address} ${clinic.phone}`.toLocaleLowerCase('ru');
    const matchesQuery = !query || searchable.includes(query);
    const matchesType = type === 'all' || clinic.tags.includes(type);
    const matchesFavorite = !clinicFavoritesOnly || favoriteClinics.includes(clinic.id);
    return matchesQuery && matchesType && matchesFavorite;
  });
  const grid = $('#clinicGrid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state clinic-empty"><b>Ничего не найдено</b>Попробуй изменить поиск или выбрать другой тип учреждения.</div>';
    return;
  }

  grid.innerHTML = filtered.map(clinic => {
    const favorite = favoriteClinics.includes(clinic.id);
    const typeLabel = clinic.type === 'polyclinic' ? 'Поликлиника' : clinic.type === 'dental' ? 'Стоматология' : clinic.tags.includes('children') ? 'Детская больница' : 'Больница';
    const mapUrl = `https://2gis.kz/petropavlovsk/search/${encodeURIComponent(`${clinic.name} ${clinic.address}`)}`;
    return `<article class="clinic-card">
      <div class="clinic-card-top"><span class="clinic-type-tag">${typeLabel}</span><button class="clinic-favorite${favorite ? ' active' : ''}" type="button" data-favorite-clinic="${clinic.id}" aria-label="${favorite ? 'Убрать из избранного' : 'Добавить в избранное'}: ${escapeHtml(clinic.name)}" aria-pressed="${favorite}">${favorite ? '♥' : '♡'}</button></div>
      <h2>${escapeHtml(clinic.name)}</h2>
      <p class="clinic-address"><span>⌖</span>${escapeHtml(clinic.address)}</p>
      <a class="clinic-phone" href="tel:${clinic.tel}"><span>☎</span>${escapeHtml(clinic.phone)}</a>
      <p class="clinic-note">${escapeHtml(clinic.note)}</p>
      <div class="clinic-links">
        ${clinic.book ? '<a class="clinic-book" href="https://egov.kz/ru/services/presale/P702" target="_blank" rel="noopener">Запись на eGov ↗</a>' : `<a class="clinic-book clinic-call" href="tel:${clinic.tel}">Уточнить по телефону ↗</a>`}
        <a class="clinic-official" href="${clinic.official}" target="_blank" rel="noopener">${escapeHtml(clinic.officialLabel)} ↗</a>
        <a class="clinic-map" href="${mapUrl}" target="_blank" rel="noopener">На карте ↗</a>
      </div>
    </article>`;
  }).join('');
}

function localQuestions(clean) {
  const questions = [];
  if (/лекарств|таблет|капсул|принимать|дозиров|мг|мл/i.test(clean)) {
    questions.push('Как точно называется препарат, в какой форме и по какому расписанию его принимать?');
    questions.push('Как долго его применять и что делать, если приём пропущен или появилась нежелательная реакция?');
    questions.push('Нужно ли учитывать другие мои лекарства, витамины или аллергии?');
  }
  if (/анализ|обследован|узи|мрт|(?:^|[^а-яё])кт(?:$|[^а-яё])|рентген|исследован|биопси|гемоглобин|эритроцит|лейкоцит|тромбоцит|глюкоз|экг/i.test(clean)) {
    questions.push('Зачем назначено это обследование и как его результат повлияет на дальнейший план?');
    questions.push('Как подготовиться: нужно ли быть натощак, можно ли пить воду и какие документы взять?');
    questions.push('Где и когда получить результат, и с кем обсудить его?');
  }
  if (/направлен|консультац|специалист|кардиолог|невролог|хирург|эндокринолог/i.test(clean)) {
    questions.push('К какому именно специалисту нужно обратиться, где записаться и в какие сроки?');
    questions.push('Нужно ли направление, и какие результаты или выписки взять на консультацию?');
  }
  if (/контрол|наблюд|измер|дневник|повторн|через\s+\d/i.test(clean)) {
    questions.push('Что именно наблюдать или записывать, как часто и в течение какого срока?');
    questions.push('Когда нужно обсудить результат наблюдения и как связаться с клиникой раньше планового визита?');
  }
  if (/питани|диет|нагруз|физическ|отдых|сон|режим|огранич/i.test(clean)) {
    questions.push('Какие именно изменения в повседневном режиме вы имеете в виду и как долго их соблюдать?');
  }
  if (/повторн(ый|ого) при[её]м|следующ(ий|его) визит|контрольн(ый|ого) визит/i.test(clean)) {
    questions.push('Когда назначить следующий приём и какие результаты или записи принести?');
  }
  if (!questions.length) {
    const excerpt = clean.split(/[\n;]+/).map(part => part.trim()).find(Boolean) || clean;
    questions.push(`Что именно мне нужно сделать по пункту «${excerpt.slice(0, 110)}${excerpt.length > 110 ? '…' : ''}», в какие сроки и у кого уточнить детали?`);
    questions.push('Какие части рекомендации относятся именно ко мне, и что делать, если формулировка остаётся непонятной?');
  }
  return [...new Set(questions)].slice(0, 5);
}

function explainLocally(raw) {
  const clean = raw.trim();
  if (clean.length < 12) {
    showToast('Добавь немного текста — минимум 12 символов');
    return;
  }
  if (clean.length > 4000) {
    showToast('Сократи текст до 4000 символов');
    return;
  }

  const foundTerms = MEDICAL_GLOSSARY.filter(entry => entry.terms.some(pattern => pattern.test(clean)));
  const questions = localQuestions(clean);
  const segments = [clean];
  const sourceText = `Локальный разбор без API-ключа\n\nТекст для сверки:\n${clean}\n\nТермины из встроенного справочника:\n${foundTerms.length ? foundTerms.map(entry => `• ${entry.title}: ${entry.meaning}`).join('\n') : '• Совпадений со встроенным словарём не найдено. Котик не будет угадывать значение — попроси врача объяснить точную формулировку.'}\n\nВопросы врачу:\n${questions.map(question => `• ${question}`).join('\n')}\n\nТекст обработан на этом устройстве. Справочник ограничен; эти объяснения не устанавливают диагноз и не меняют рекомендации врача.`;

  const result = $('#explainResult');
  result.innerHTML = `
    <div class="result-badge local-result-badge"><span>⌂</span> ЛОКАЛЬНЫЙ РЕЖИМ · НИЧЕГО НЕ ОТПРАВЛЕНО</div>
    <h2>Что написано и что уточнить</h2>
    <p class="result-intro">Это не ответ искусственного интеллекта: браузер сверил текст с небольшим встроенным словарём и подобрал вопросы по словам в рекомендации.</p>
    <section class="local-result-section"><h3>Текст врача для сверки</h3><blockquote>${escapeHtml(segments.join('\n'))}</blockquote></section>
    <section class="local-result-section"><h3>Знакомые термины</h3>${foundTerms.length ? `<ul>${foundTerms.map(entry => `<li><b>${escapeHtml(entry.title)}:</b> ${escapeHtml(entry.meaning)}</li>`).join('')}</ul>` : '<p>Встроенный справочник не нашёл знакомых терминов. Не буду угадывать — выдели непонятную фразу и попроси врача объяснить её в контексте заключения.</p>'}</section>
    <section class="local-result-section"><h3>Вопросы, которые можно задать</h3><ul>${questions.map(question => `<li>${escapeHtml(question)}</li>`).join('')}</ul></section>
    <p class="result-caution">Словарь ограничен и может не распознать формулировку. Не меняй лечение по этому разбору; уточни значение и план у врача или фармацевта.</p>
    <div class="result-actions"><button class="primary-button" id="saveExplain">Сохранить заметку</button><button class="secondary-button" id="downloadExplain">Скачать разбор ↓</button></div>`;
  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });

  $('#saveExplain').onclick = () => {
    addNote('explain', 'Локальный разбор рекомендации', sourceText);
    showToast('Локальный разбор сохранён в заметках этого браузера');
  };
  $('#downloadExplain').onclick = () => downloadText('локальный-разбор-рекомендации.txt', sourceText);
}

function setView(name) {
  const labels = {
    home: 'Обзор',
    diary: 'Дневник наблюдений',
    prepare: 'Подготовка к приёму',
    explain: 'Разобрать рекомендации',
    glossary: 'Медицинский словарь',
    clinics: 'Клиники Петропавловска',
    after: 'После приёма',
    notes: 'Мои заметки'
  };

  $$('.view').forEach(section => {
    section.classList.toggle('active', section.id === name);
  });

  $$('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === name);
  });

  $('#crumb').textContent = labels[name] || 'Обзор';
  $('#sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'notes') renderNotes();
  if (name === 'diary') renderDiary();
  if (name === 'after') renderNextVisit();
  if (name === 'glossary') renderGlossary();
  if (name === 'clinics') renderClinics();
}

function makePrepResult(form) {
  const concern = form.concern.trim();
  const since = form.since.trim();
  const frequency = form.frequency;
  const context = form.context.trim();
  const bring = form.bring || [];
  const points = [];
  const visitDiary = form.includeDiary
    ? sortedDiaryEntries().slice(0, 5).map(entry => `${formatDay(entry.date)} — ${entry.observation}${entry.context ? ` (контекст: ${entry.context})` : ''}`)
    : [];

  if (concern) points.push(`Что беспокоит: ${concern}`);
  if (since) points.push(`Когда началось: ${since}`);
  if (frequency) points.push(`Как часто: ${frequency.toLowerCase()}`);
  if (context) points.push(`Что ещё важно: ${context}`);

  const questions = buildVisitQuestions({
    concern,
    since,
    frequency,
    context
  });

  const result = $('#prepResult');

  const groups = [
    {
      key: 'about',
      title: 'Разобраться в ситуации',
      number: '01',
      items: questions.about
    },
    {
      key: 'plan',
      title: 'Обследования и варианты',
      number: '02',
      items: questions.plan
    },
    {
      key: 'followup',
      title: 'Что делать дальше',
      number: '03',
      items: questions.followup
    }
  ].filter(group => group.items.length);

  result.innerHTML = `
    <div class="result-topline">
      <span class="result-mark">✦</span>
      <span class="eyebrow">ШПАРГАЛКА К ПРИЁМУ</span>
      <button type="button" class="edit-result" id="editPrep">
        Изменить ответы
      </button>
    </div>

    <h2>Вопросы, которые помогут прояснить план</h2>
    <p class="result-intro">
      Отметь 2–3 главных вопроса. Остальные оставь, если они подходят
      к твоей ситуации. Это подсказки для разговора, не медицинская оценка.
    </p>

    ${points.length ? `
      <div class="visit-summary">
        <span>ТВОИ НАБЛЮДЕНИЯ</span>
        <p>${points.map(point => `
          <span>${escapeHtml(point)}</span>
        `).join('')}</p>
      </div>
    ` : ''}

    ${visitDiary.length ? `
      <div class="visit-summary diary-summary">
        <span>ЗАПИСИ ИЗ ДНЕВНИКА · ${visitDiary.length}</span>
        <ul>${visitDiary.map(entry => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>
      </div>
    ` : ''}

    ${bring.length ? `
      <div class="bring-summary">
        <span>ЧТО ПОДГОТОВИТЬ ИЛИ ВЗЯТЬ</span>
        <ul>
          ${bring.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="question-groups">
      ${groups.map(group => `
        <section class="question-group">
          <div class="question-group-heading">
            <span>${group.number}</span>
            <h3>${group.title}</h3>
          </div>

          <div class="question-list">
            ${group.items.map((question, index) => {
              const recommended =
                (group.key === 'plan' && index < 2) ||
                (group.key === 'followup' && index === 1);

              return `
                <label class="question-card">
                  <input
                    type="checkbox"
                    class="question-check"
                    ${recommended ? 'checked' : ''}
                    data-question
                  >
                  <span class="question-checkmark">✓</span>
                  <span class="question-text">${escapeHtml(question)}</span>
                  ${recommended
                    ? '<span class="question-priority">основной</span>'
                    : ''}
                </label>
              `;
            }).join('')}
          </div>
        </section>
      `).join('')}
    </div>

    <div class="result-actions">
      <button class="primary-button" id="savePrep">
        Сохранить выбранные
      </button>
      <button class="secondary-button" id="copyPrep">
        Скопировать
      </button>
      <button class="secondary-button" id="downloadPrep">
        Скачать шпаргалку ↓
      </button>
      <button class="secondary-button" id="printPrep">
        Печать / сохранить PDF
      </button>
    </div>
  `;

  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const makeText = () => {
    const selectedQuestions = $$('[data-question]:checked', result)
      .map(input =>
        input.closest('.question-card')
          .querySelector('.question-text').textContent
      );

    return `Подготовка к приёму

${points.map(point => `• ${point}`).join('\n')}${
  bring.length
    ? `\n\nПодготовить или взять:\n${bring.map(item => `• ${item}`).join('\n')}`
    : ''
}${visitDiary.length
  ? `\n\nНедавние наблюдения из дневника:\n${visitDiary.map(entry => `• ${entry}`).join('\n')}`
  : ''
}

Вопросы врачу:
${selectedQuestions.length
    ? selectedQuestions.map(question => `• ${question}`).join('\n')
    : 'Пока не выбраны — отметь подходящие вопросы.'}`;
  };

  $('#editPrep').onclick = () => {
    result.classList.add('hidden');
    $('#prepareForm').scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    $('#concern').focus();
  };

  $('#savePrep').onclick = () => {
    addNote('prepare', 'Подготовка к приёму', makeText());
    showToast('Шпаргалка сохранена в заметках');
  };

  $('#copyPrep').onclick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(makeText());
      } else {
        const copyField = document.createElement('textarea');
        copyField.value = makeText();
        copyField.style.position = 'fixed';
        copyField.style.opacity = '0';
        document.body.append(copyField);
        copyField.select();
        document.execCommand('copy');
        copyField.remove();
      }

      showToast('Шпаргалка скопирована');
    } catch {
      showToast('Не получилось скопировать — скачай шпаргалку');
    }
  };

  $('#downloadPrep').onclick = () => {
    downloadText('шпаргалка-к-врачу.txt', makeText());
  };

  $('#printPrep').onclick = () => {
    document.body.classList.add('printing-prep');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-prep');
    }, { once: true });
    window.print();
  };
}

function buildVisitQuestions({ concern, since, frequency, context }) {
  const about = [];
  const plan = [];
  const followup = [];
  const trimmedConcern = concern.replace(/[.!?]+$/, '').slice(0, 100);

  about.push(
    trimmedConcern
      ? `По поводу «${trimmedConcern}»: какие детали мне важно уточнить, чтобы вы могли лучше оценить ситуацию?`
      : 'Какие подробности о моих симптомах помогут вам точнее оценить ситуацию?'
  );

  if (since) {
    about.push(
      `Учитывая, что это началось ${since}, меняет ли длительность симптомов то, что стоит проверить или обсудить сегодня?`
    );
  }

  if (frequency) {
    about.push(
      `При такой частоте — «${frequency.toLowerCase()}» — что лучше отмечать до следующего приёма: время, обстоятельства или изменения симптомов?`
    );
  }

  if (context) {
    const observation = context.replace(/[.!?]+$/, '').slice(0, 120);
    about.push(
      `В моих наблюдениях есть такая связь: «${observation}». Может ли она быть важна? Что именно стоит понаблюдать или записать?`
    );
  }

  plan.push(
    'Какие возможные причины вы рассматриваете, и что в моих наблюдениях поможет их различить?'
  );
  plan.push(
    'Нужно ли мне обследование? Что оно поможет выяснить и как его результат повлияет на дальнейший план?'
  );
  plan.push(
    'Какие варианты действий подходят в моей ситуации, каковы ожидаемая польза и возможные риски каждого?'
  );

  if (/лекарств|таблет|препарат|спрей|капл|лечени|принимаю/i.test(
    `${concern} ${context}`
  )) {
    plan.push(
      'Если вы рекомендуете лекарство: как именно его применять, как долго, и что делать при нежелательной реакции или пропуске?'
    );
  }

  followup.push(
    'Если сначала наблюдаем: как долго, какие изменения записывать и когда оценить результат?'
  );
  followup.push(
    'Когда мне нужно прийти повторно или связаться с вами? Какие изменения требуют обратиться раньше и куда?'
  );

  return { about, plan, followup };
}

function downloadText(filename, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadNote(note) {
  const prefix = note.type === 'prepare' ? 'подготовка' : note.type === 'after' ? 'итог-приёма' : note.type === 'diary' ? 'наблюдение' : 'заметка';
  const filename = `${prefix}-${note.created.slice(0, 10)}.txt`;
  downloadText(filename, `${note.title}\n${formatDate(note.created)}\n\n${note.body}`);
}

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const downloadButton = event.target.closest('[data-download-note]');
  if (downloadButton) {
    const note = notes.find(item => item.id === downloadButton.dataset.downloadNote);
    if (note) downloadNote(note);
    return;
  }

  const deleteButton = event.target.closest('[data-delete-note]');
  if (deleteButton) {
    const targetNote = notes.find(item => item.id === deleteButton.dataset.deleteNote);
    if (targetNote?.type === 'diary') {
      diaryEntries = diaryEntries.filter(entry => entry.id !== targetNote.sourceId);
      persistDiary();
    }
    notes = notes.filter(item => item.id !== deleteButton.dataset.deleteNote);
    persist();
    showToast('Заметка удалена');
  }

  if (event.target.closest('#mascot')) petMascot();
});

$('#mascot').addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    petMascot();
  }
});

function petMascot() {
  const mascot = $('#mascot');
  mascot.classList.remove('purr');
  requestAnimationFrame(() => mascot.classList.add('purr'));
  $('#catGreeting').textContent = 'Мур! Я рядом. Запиши то, что важно, а медицинские решения обсуди со специалистом.';
  clearTimeout(greetingTimer);
  greetingTimer = setTimeout(() => {
    $('#catGreeting').textContent = 'Я помогу собрать вопросы и сохранить главное. Решения о лечении остаются за врачом.';
    mascot.classList.remove('purr');
  }, 2600);
}

$('#prepareForm').addEventListener('submit', event => {
  event.preventDefault();
  makePrepResult({
    concern: $('#concern').value,
    since: $('#since').value,
    frequency: $('#frequency').value,
    context: $('#context').value,
    bring: $$('input[name="bring"]:checked').map(input => input.value),
    includeDiary: $('#includeDiary').checked
  });
});

$('#diaryForm').addEventListener('submit', event => {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID?.() || String(Date.now()),
    date: $('#diaryDate').value,
    impact: $('#diaryImpact').value,
    observation: $('#diaryObservation').value.trim(),
    context: $('#diaryContext').value.trim(),
    created: new Date().toISOString()
  };

  diaryEntries.unshift(entry);
  persistDiary();
  addNote('diary', `Наблюдение · ${formatDay(entry.date)}`, `${entry.observation}${entry.context ? `\n\nКонтекст: ${entry.context}` : ''}\n\nВлияние на день: ${entry.impact}`, { sourceId: entry.id });
  event.currentTarget.reset();
  $('#diaryDate').value = localDateString();
  $('#diaryImpact').selectedIndex = 0;
  showToast('Наблюдение сохранено в дневнике');
});

$('#clearDiary').addEventListener('click', () => {
  if (!diaryEntries.length) {
    showToast('Дневник уже пуст');
    return;
  }
  diaryEntries = [];
  persistDiary();
  notes = notes.filter(note => note.type !== 'diary');
  persist();
  showToast('Наблюдения удалены с этого устройства');
});

$('#diaryEntries').addEventListener('click', event => {
  const button = event.target.closest('[data-delete-diary]');
  if (!button) return;
  diaryEntries = diaryEntries.filter(entry => entry.id !== button.dataset.deleteDiary);
  persistDiary();
  notes = notes.filter(note => !(note.type === 'diary' && note.sourceId === button.dataset.deleteDiary));
  persist();
  showToast('Наблюдение удалено');
});

$('#afterForm').addEventListener('submit', event => {
  event.preventDefault();
  const plan = $('#afterPlan').value.trim();
  const tests = $('#afterTests').value.trim();
  const nextDate = $('#afterDate').value;
  const questions = $('#afterQuestions').value.trim();
  const body = `Договорённости и план:\n${plan}${tests ? `\n\nОбследование или следующий шаг:\n${tests}` : ''}${nextDate ? `\n\nСледующий приём: ${formatDay(nextDate)}` : ''}${questions ? `\n\nЧто уточнить:\n${questions}` : ''}\n\nЛичная запись. При сомнениях уточни план у врача или фармацевта.`;

  addNote('after', 'Итог после приёма', body);
  try {
    if (nextDate) localStorage.setItem(NEXT_VISIT_STORE, nextDate);
    else localStorage.removeItem(NEXT_VISIT_STORE);
  } catch {}
  renderNextVisit();
  event.currentTarget.reset();
  showToast('Итог приёма сохранён в заметках');
});

$('#explainLocal').addEventListener('click', () => explainLocally($('#doctorText').value));

$('#doctorText').addEventListener('input', event => {
  $('#charCount').textContent = `${event.target.value.length} / 4000`;
});

$('#clinicSearch').addEventListener('input', renderClinics);
$('#clinicType').addEventListener('change', renderClinics);
$('#glossarySearch').addEventListener('input', renderGlossary);
$$('[data-glossary-filter]').forEach(button => {
  button.addEventListener('click', () => {
    glossaryFilter = button.dataset.glossaryFilter;
    $$('[data-glossary-filter]').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    renderGlossary();
  });
});
$('#clinicFavorites').addEventListener('click', event => {
  clinicFavoritesOnly = !clinicFavoritesOnly;
  event.currentTarget.classList.toggle('active', clinicFavoritesOnly);
  event.currentTarget.textContent = clinicFavoritesOnly ? '♥ Только избранное' : '♡ Избранное';
  renderClinics();
});
$('#clinicGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-favorite-clinic]');
  if (!button) return;
  const id = button.dataset.favoriteClinic;
  favoriteClinics = favoriteClinics.includes(id)
    ? favoriteClinics.filter(favoriteId => favoriteId !== id)
    : [...favoriteClinics, id];
  try {
    localStorage.setItem(CLINIC_FAVORITES_STORE, JSON.stringify(favoriteClinics));
  } catch {
    showToast('Не удалось сохранить избранное в этом браузере');
  }
  renderClinics();
});

$('#menuToggle').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
});

function toggleTheme() {
  const dark = document.documentElement.dataset.theme !== 'dark';

  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem(THEME, dark ? 'dark' : 'light');
  $('#themeToggle').innerHTML = `<span>${dark ? '☀' : '☾'}</span> ${dark ? 'Светлая тема' : 'Тёмная тема'}`;
  $('#topTheme').textContent = dark ? '☀' : '☾';
}

$('#themeToggle').addEventListener('click', toggleTheme);
$('#topTheme').addEventListener('click', toggleTheme);

$('#clearNotes').addEventListener('click', () => {
  if (!notes.length) {
    showToast('Заметок пока нет');
    return;
  }

  notes = [];
  persist();
  showToast('Все заметки удалены из этого браузера');
});

$('#exportNotes').addEventListener('click', () => {
  if (!notes.length) {
    showToast('Сначала сохрани заметку');
    return;
  }

  const text = notes.map(note =>
    `${note.title} · ${formatDate(note.created)}\n\n${note.body}`
  ).join('\n\n————————————\n\n');

  downloadText('мои-заметки-котик.txt', text);
});

const savedTheme = localStorage.getItem(THEME);

if (savedTheme === 'dark') {
  document.documentElement.dataset.theme = 'dark';
  $('#themeToggle').innerHTML = '<span>☀</span> Светлая тема';
  $('#topTheme').textContent = '☀';
}

renderNotes();
renderDiary();
renderNextVisit();
$('#diaryDate').value = localDateString();
