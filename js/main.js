async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // Header가 로드된 후 테마 토글 이벤트 연결
        if (elementId === 'header-container') {
            setupThemeToggle();
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // 저장된 테마 적용
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    toggleBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggleBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 테마 즉시 적용 (깜빡임 방지)
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    loadComponent('components/header.html', 'header-container');
    loadComponent('components/footer.html', 'footer-container');
    initCalendar();
});

const nationalHolidays2026 = {
    "01-01": "New Year's Day",
    "04-03": "Good Friday",
    "04-06": "Easter Monday",
    "05-01": "Labor Day",
    "05-14": "Ascension Day",
    "05-25": "Whit Monday",
    "10-03": "German Unity Day",
    "12-25": "Christmas Day",
    "12-26": "Boxing Day"
};

const stateSpecificHolidays2026 = {
    "01-06": { name: "Epiphany", states: ["BW", "BY", "ST"] },
    "03-08": { name: "Women's Day", states: ["BE", "MV"] },
    "04-05": { name: "Easter Sunday", states: ["BB"] },
    "05-24": { name: "Whit Sunday", states: ["BB"] },
    "06-04": { name: "Corpus Christi", states: ["BW", "BY", "HE", "NW", "RP", "SL"] },
    "08-15": { name: "Assumption Day", states: ["BY", "SL"] },
    "10-31": { name: "Reformation Day", states: ["BB", "HB", "HH", "MV", "NI", "SH", "SN", "ST", "TH"] },
    "11-01": { name: "All Saints' Day", states: ["BW", "BY", "NW", "RP", "SL"] },
    "11-18": { name: "Day of Prayer", states: ["SN"] }
};

let currentYear = 2026;
let currentMonth = 2; // March
let selectedState = "ALL";

function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const stateSelect = document.getElementById('stateSelect');
    
    if(!prevBtn || !nextBtn || !stateSelect) return;

    renderCalendar(currentYear, currentMonth);

    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });

    stateSelect.addEventListener('change', (e) => {
        selectedState = e.target.value;
        renderCalendar(currentYear, currentMonth);
    });
}

function renderCalendar(year, month) {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('currentMonthDisplay');
    const holidayListUl = document.getElementById('holidays');
    
    if(!grid || !monthDisplay || !holidayListUl) return;
    
    grid.innerHTML = '';
    holidayListUl.innerHTML = '';
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthDisplay.textContent = `${monthNames[month]} ${year}`;

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        const totalIndex = firstDay + day - 1;
        const weekNum = Math.floor(totalIndex / 7);
        cell.className = `calendar-day week-${weekNum % 6}`;

        const dateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let holidayName = nationalHolidays2026[dateStr];
        const stateHoliday = stateSpecificHolidays2026[dateStr];

        if (stateHoliday && (selectedState === "ALL" || stateHoliday.states.includes(selectedState))) {
            holidayName = holidayName ? `${holidayName} / ${stateHoliday.name}` : stateHoliday.name;
        }

        cell.innerHTML = `<span class="day-num">${day}</span>`;
        if (holidayName) {
            cell.classList.add('holiday-cell');
            cell.innerHTML += `<span class="holiday-name">${holidayName}</span>`;
            const li = document.createElement('li');
            li.textContent = `${monthNames[month]} ${day}: ${holidayName}`;
            holidayListUl.appendChild(li);
        }
        grid.appendChild(cell);
    }

    if (!holidayListUl.innerHTML) {
        holidayListUl.innerHTML = '<li>No holidays this month.</li>';
    }

    // 대시보드 위젯 업데이트
    updateDashboard(year, month);
    setupICalExport();
}

// --- Dashboard Logic ---

function getAllHolidaysForState(state) {
    const allHolidays = [];
    for (const [dateStr, name] of Object.entries(nationalHolidays2026)) {
        allHolidays.push({ dateStr, name });
    }
    for (const [dateStr, data] of Object.entries(stateSpecificHolidays2026)) {
        if (state === "ALL" || data.states.includes(state)) {
            // 중복 날짜 처리
            const existing = allHolidays.find(h => h.dateStr === dateStr);
            if (existing) {
                existing.name += ` / ${data.name}`;
            } else {
                allHolidays.push({ dateStr, name: data.name });
            }
        }
    }
    return allHolidays.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

function updateDashboard(year, month) {
    const statusWidget = document.getElementById('today-status');
    const detailWidget = document.getElementById('today-detail');
    const countdownTimer = document.getElementById('countdown-timer');
    const nextHolidayName = document.getElementById('next-holiday-name');
    
    if(!statusWidget) return; // 위젯이 없는 페이지(블로그 등) 방어

    const holidays = getAllHolidaysForState(selectedState);
    
    // 시뮬레이션을 위해 오늘을 2026년 3월 2일로 고정 (또는 실제 Date 객체 사용 가능)
    // 실제 라이브 서비스에서는 const today = new Date(); 를 사용해야 하지만, 2026년 달력이므로 가상의 '오늘'을 씁니다.
    const today = new Date('2026-03-02T00:00:00');
    const todayStr = "03-02";

    // 1. Is Today a Holiday?
    const todayHoliday = holidays.find(h => h.dateStr === todayStr);
    if (todayHoliday) {
        statusWidget.textContent = "Yes!";
        statusWidget.style.color = "#28a745";
        detailWidget.textContent = `Today is ${todayHoliday.name}. Most shops are closed.`;
    } else {
        statusWidget.textContent = "No";
        statusWidget.style.color = "var(--text)";
        detailWidget.textContent = "It's a regular working day. Shops are open.";
    }

    // 2. Next Holiday Countdown
    let nextHoliday = null;
    for (const h of holidays) {
        if (h.dateStr > todayStr) {
            nextHoliday = h;
            break;
        }
    }
    
    // 만약 올해 남은 휴일이 없다면 내년 첫 휴일로 처리 (간단화)
    if (!nextHoliday && holidays.length > 0) {
        nextHoliday = holidays[0]; // 다음 해로 넘어간다고 가정
    }

    if (nextHoliday) {
        const [hMonth, hDay] = nextHoliday.dateStr.split('-');
        const nextDate = new Date(2026, parseInt(hMonth)-1, parseInt(hDay));
        const diffTime = Math.abs(nextDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        countdownTimer.textContent = `${diffDays} days`;
        nextHolidayName.textContent = `until ${nextHoliday.name} (${hDay}.${hMonth}.2026)`;
    }
}

// 3. Export to iCal
function setupICalExport() {
    const exportBtn = document.getElementById('export-ical');
    if (!exportBtn || exportBtn.dataset.listenerAttached) return;
    
    exportBtn.dataset.listenerAttached = 'true';
    exportBtn.addEventListener('click', () => {
        const holidays = getAllHolidaysForState(selectedState);
        let icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//German Holiday Calendar//EN\n";
        
        holidays.forEach(h => {
            const [hMonth, hDay] = h.dateStr.split('-');
            const dateStr = `2026${hMonth}${hDay}`;
            icsMSG += "BEGIN:VEVENT\n";
            icsMSG += `DTSTART;VALUE=DATE:${dateStr}\n`;
            icsMSG += `DTEND;VALUE=DATE:${dateStr}\n`;
            icsMSG += `SUMMARY:${h.name}\n`;
            icsMSG += "END:VEVENT\n";
        });
        
        icsMSG += "END:VCALENDAR";
        
        const blob = new Blob([icsMSG], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `German_Holidays_2026_${selectedState}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

