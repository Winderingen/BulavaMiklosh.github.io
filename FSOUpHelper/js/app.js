// ================================================================
// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
// ================================================================

// ================================================================
// 1. СОСТОЯНИЕ
// ================================================================
let state = {
    department: 'OBO',
    rankFrom: 'Сержант',
    rankTo: 'Старший Сержант',
    links: {
        profile: '',
        fullName: ''
    }
};

// ================================================================
// 2. РЕНДЕРИНГ
// ================================================================

// Заполнить селект отделов
function populateDepartmentSelect() {
    const select = document.getElementById('departmentSelect');
    const keys = getDepartmentKeys();
    
    select.innerHTML = '';
    keys.forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = getDepartmentName(key);
        select.appendChild(opt);
    });
    
    // Установить текущее значение
    if (keys.includes(state.department)) {
        select.value = state.department;
    }
}

// Заполнить селекты званий
function populateRankSelects() {
    const allRanks = getAllRanks(state.department);
    const fromSelect = document.getElementById('rankFromSelect');

    const currentFrom = state.rankFrom;

    fromSelect.innerHTML = '';

    allRanks.forEach(rank => {
        const opt = document.createElement('option');
        opt.value = rank;
        opt.textContent = rank;
        fromSelect.appendChild(opt);
    });

    if (allRanks.includes(currentFrom)) fromSelect.value = currentFrom;
    else fromSelect.value = allRanks[0] || '';

    state.rankFrom = fromSelect.value;
    
    // Автоматически определяем желаемое звание
    updateAutoRank();
    updateRankPreview();
}

// Автоматическое определение желаемого звания
function updateAutoRank() {
    const nextRank = getNextRank(state.department, state.rankFrom);
    if (nextRank) {
        state.rankTo = nextRank;
        document.getElementById('rankToAuto').textContent = nextRank;
    } else {
        state.rankTo = state.rankFrom;
        document.getElementById('rankToAuto').textContent = 'Нет следующего звания';
    }
}

// Обновить превью звания
function updateRankPreview() {
    const preview = document.getElementById('rankPreview');
    if (preview) {
        preview.textContent = state.rankFrom;
    }
}

// Отобразить требования слева
function renderRequirements() {
    const container = document.getElementById('requirementsList');
    const path = getCurrentPath(state.department, state.rankFrom, state.rankTo);
    
    if (!path || path.requirements.length === 0) {
        container.innerHTML = `
            <div class="req-item" style="color: var(--text-muted);">
                Нет требований для этого перехода
            </div>
        `;
        return;
    }
    
    container.innerHTML = path.requirements.map((req, idx) => `
        <div class="req-item">
            <span class="req-badge">#${idx + 1}</span>
            <span class="req-text">${req}</span>
        </div>
    `).join('');
}

// Создать поля для ввода ссылок справа (с поддержкой многострочного ввода)
function renderLinkFields() {
    const container = document.getElementById('requirementsFields');
    const path = getCurrentPath(state.department, state.rankFrom, state.rankTo);

    if (!path || path.requirements.length === 0) {
        container.innerHTML = `
            <div style="color: var(--text-muted); font-size: 14px; padding: 12px 0;">
                ⚠️ Нет требований для выбранного перехода
            </div>
        `;
        return;
    }

    let html = '';
    path.requirements.forEach((req, idx) => {
        const fieldId = `req_${idx}`;
        const val = state.links[fieldId] || '';
        html += `
            <div class="form-group">
                <div class="requirement-label">
                    <span class="req-num">${idx + 1}</span>
                    <span>${req}</span>
                    <span class="multi-hint">(можно вставить несколько ссылок, каждая с новой строки)</span>
                </div>
                <textarea class="input-field link-input" id="${fieldId}" 
                          placeholder="Вставьте ссылку(и) на подтверждение&#10;Каждая ссылка с новой строки" 
                          rows="2">${val}</textarea>
            </div>
        `;
    });

    container.innerHTML = html;

    // Привязать события сохранения
    container.querySelectorAll('.link-input').forEach(input => {
        input.addEventListener('input', function() {
            state.links[this.id] = this.value;
            // Автоматически увеличиваем высоту textarea
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
        // Инициализируем высоту
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    });
}

// Обработка поля профиля
function bindProfileField() {
    const input = document.getElementById('profileLink');
    if (!input) return;
    input.value = state.links['profile'] || '';
    input.addEventListener('input', function() {
        state.links['profile'] = this.value;
    });
}

// Обработка поля ФИО
function bindFullNameField() {
    const input = document.getElementById('fullName');
    if (!input) return;
    input.value = state.links['fullName'] || '';
    input.addEventListener('input', function() {
        state.links['fullName'] = this.value;
    });
}

// ================================================================
// 3. ГЕНЕРАЦИЯ ОТЧЕТА
// ================================================================
function generateReport() {
    const path = getCurrentPath(state.department, state.rankFrom, state.rankTo);
    if (!path) {
        showToast('❌ Ошибка: путь повышения не найден');
        return;
    }

    const rankFrom = state.rankFrom;
    const rankTo = state.rankTo;
    const depName = getDepartmentShortName(state.department);
    const fullName = state.links['fullName'] || '[ФИО НЕ УКАЗАНО]';
    const profileLink = state.links['profile'] || '[ССЫЛКА НА ПРОФИЛЬ НЕ УКАЗАНА]';
    
    const constants = getConstantsForDepartment(state.department);

    // Собираем требования со ссылками (поддерживаем многострочный ввод)
    let reqLines = [];
    path.requirements.forEach((req, idx) => {
        const rawLinks = state.links[`req_${idx}`] || '';
        const links = rawLinks.split('\n').filter(link => link.trim() !== '');
        
        if (links.length === 0) {
            reqLines.push(`${req} — [ССЫЛКА НЕ УКАЗАНА]`);
        } else if (links.length === 1) {
            reqLines.push(`${req} — ${links[0].trim()}`);
        } else {
            // Несколько ссылок - выводим в столбик
            const linkLines = links.map(link => `  • ${link.trim()}`).join('\n');
            reqLines.push(`${req}:\n${linkLines}`);
        }
    });

    const reqText = reqLines.join('\n');

    // Для Академии и АС особый префикс
    let reportPrefix = constants.reportPrefix || 'К ходатайству прикладываю следующие документы:';
    
    // Для Академии добавляем "в связи с прохождением курса"
    let additionalText = '';
    if (state.department === 'ACADEMY') {
        additionalText = `, в связи с прохождением ${getCourseNumber(rankFrom)} курса обучения`;
    }
    
    // Для АС добавляем специальное примечание для последнего уровня
    let specialNote = '';
    if (state.department === 'AS' && rankTo === 'Капитан') {
        specialNote = '\n\nПримечание: Повышение происходит на усмотрение Начальника АС ФСО.';
    }

    const report = `
Кому: ${constants.toRole}
Копия: ${constants.cc}
От: ${profileLink}

Я, ${rankFrom} ${depName} ${fullName}, прошу рассмотреть мое ходатайство на присвоение мне очередного воинского звания ${rankTo}${additionalText}.
${reportPrefix}
${reqText}${specialNote}
    `.trim();

    // Показать отчет
    const output = document.getElementById('reportOutput');
    const body = document.getElementById('reportBody');
    body.textContent = report;
    output.classList.add('active');

    // Прокрутить к отчету на мобильных
    if (window.innerWidth < 900) {
        output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showToast('✅ Отчет сгенерирован');
}

// Вспомогательная функция для определения курса в Академии
function getCourseNumber(rank) {
    const courseMap = {
        'Рядовой': '1',
        'Ефрейтор': '2',
        'Младший Сержант': '3',
        'Сержант': '4'
    };
    return courseMap[rank] || '';
}

// ================================================================
// 4. КОПИРОВАНИЕ
// ================================================================
function copyReport() {
    const body = document.getElementById('reportBody');
    const text = body.textContent;
    if (!text || text.trim() === '') {
        showToast('⚠️ Сначала сгенерируйте отчет');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Отчет скопирован в буфер обмена');
    }).catch(() => {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('✅ Отчет скопирован');
    });
}

// ================================================================
// 5. TOAST
// ================================================================
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================================================================
// 6. ОБНОВЛЕНИЕ ВСЕГО ИНТЕРФЕЙСА
// ================================================================
function refreshAll() {
    populateRankSelects();
    renderRequirements();
    renderLinkFields();
    bindProfileField();
    bindFullNameField();
    updateRankPreview();

    // Скрыть старый отчет
    document.getElementById('reportOutput').classList.remove('active');
}

// ================================================================
// 7. ИНИЦИАЛИЗАЦИЯ
// ================================================================
function init() {
    // Загрузить тему
    if (window.themeManager) {
        window.themeManager.loadTheme();
    }
    
    // Заполнить селект отделов
    populateDepartmentSelect();
    
    // Инициализировать состояние
    const deptSelect = document.getElementById('departmentSelect');
    state.department = deptSelect.value;
    
    // Заполнить все
    refreshAll();

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    
    // Смена отдела
    deptSelect.addEventListener('change', function() {
        state.department = this.value;
        state.links = { profile: state.links.profile || '', fullName: state.links.fullName || '' };
        refreshAll();
    });

    // Смена звания
    document.getElementById('rankFromSelect').addEventListener('change', function() {
        state.rankFrom = this.value;
        const keepLinks = {
            profile: state.links.profile || '',
            fullName: state.links.fullName || ''
        };
        state.links = keepLinks;
        refreshAll();
    });

    // Генерация отчета
    document.getElementById('generateBtn').addEventListener('click', generateReport);

    // Копирование
    document.getElementById('copyReportBtn').addEventListener('click', copyReport);

    // Очистка полей
    document.getElementById('clearBtn').addEventListener('click', function() {
        state.links = { profile: '', fullName: '' };
        refreshAll();
        document.getElementById('reportOutput').classList.remove('active');
        showToast('🧹 Все поля очищены');
    });

    // Переключение темы
    document.getElementById('themeToggle').addEventListener('click', function() {
        if (window.themeManager) {
            window.themeManager.toggleTheme();
        }
    });

    // Горячие клавиши (Ctrl+Enter)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateReport();
        }
    });

    console.log('🚀 Генератор отчетов загружен');
    console.log('💡 Нажмите Ctrl+Enter для быстрой генерации');
    console.log('📝 В полях требований можно вставлять несколько ссылок (каждая с новой строки)');
    console.log('📋 Доступные отделы:', getDepartmentKeys().join(', '));
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', init);