/**
 * 현재 페이지의 깊이에 따라 루트 경로(./ 또는 ../ 또는 ../../)를 반환하는 함수
 */
function getBasePath() {
    const path = window.location.pathname;
    // GitHub Pages(/about/) 환경 고려
    const depth = (path.match(/\//g) || []).length;
    // 로컬 파일 시스템 또는 루트 도메인인 경우를 체크하여 경로 계산
    if (path.includes('/blog/') || path.includes('/states/')) {
        return '../';
    }
    return './';
}

const basePath = getBasePath();

async function loadComponent(url, elementId) {
    try {
        const fullUrl = basePath + url;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Failed to load ${fullUrl}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // 로드된 헤더의 링크들을 basePath에 맞게 조정 (서브디렉토리 대응)
        const container = document.getElementById(elementId);
        container.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                link.setAttribute('href', basePath + href.replace('../', ''));
            }
        });

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
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    loadComponent('components/header.html', 'header-container');
    loadComponent('components/footer.html', 'footer-container');
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        initCalendar();
    }
});

// 휴일 이름과 블로그 파일 매핑
const holidayLinkMap = {
    "New Year's Day": "new-year-traditions.html",
    "Good Friday": "easter-germany.html",
    "Easter Monday": "easter-germany.html",
    "Easter Sunday": "easter-germany.html",
    "Labor Day": "labor-day-may-1st.html",
    "Ascension Day": "ascension-fathers-day.html",
    "Whit Monday": "pentecost-pfingsten.html",
    "Whit Sunday": "pentecost-pfingsten.html",
    "German Unity Day": "german-unity-day.html",
    "Christmas Day": "christmas-germany.html",
    "Boxing Day": "christmas-germany.html",
    "Epiphany": "three-kings-day.html",
    "Women's Day": "womens-day-berlin.html",
    "Corpus Christi": "corpus-christi.html",
    "Reformation Day": "reformation-all-saints.html",
    "All Saints' Day": "reformation-all-saints.html",
    "Day of Prayer": "emergency-services.html"
};

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
            
            // 휴일 이름을 링크로 변환
            const names = holidayName.split(' / ');
            const linkedNames = names.map(name => {
                const file = holidayLinkMap[name];
                if (file) {
                    return `<a href="${basePath}blog/${file}" class="holiday-link" style="color: inherit; text-decoration: underline;">${name}</a>`;
                }
                return name;
            }).join(' / ');

            cell.innerHTML += `<span class="holiday-name">${linkedNames}</span>`;
            
            const li = document.createElement('li');
            li.innerHTML = `${monthNames[month]} ${day}: ${linkedNames}`;
            holidayListUl.appendChild(li);
        }
        grid.appendChild(cell);
    }

    if (!holidayListUl.innerHTML) {
        holidayListUl.innerHTML = '<li>No holidays this month.</li>';
    }

    updateDashboard(year, month);
    setupICalExport();
    updateMonthlyEvents(month);
}

// --- Event Data & Logic ---

const monthlyEvents2026 = {
    0: ["Cologne Carnival (Season Peak)", "Berlin Fashion Week"],
    1: ["Berlinale (Berlin International Film Festival)", "Cologne Carnival (Rose Monday)"],
    2: ["Leipzig Book Fair", "Starkbierfest (Munich Strong Beer Festival)"],
    3: ["Easter Markets", "Spring Festivals (Frühlingsfeste)"],
    4: ["May Day Festivals", "Hamburg Port Anniversary (Hafengeburtstag)"],
    5: ["Kiel Week (Sailing Event)", "Rock am Ring / Rock im Park"],
    6: ["Munich Opera Festival", "Christopher Street Day (CSD) Berlin"],
    7: ["Bayreuth Festival", "Mainz Wine Market"],
    8: ["Oktoberfest Starts (Late Sept)", "Stuttgart Beer Festival (Cannstatter Volksfest)"],
    9: ["German Unity Day Celebrations", "Frankfurt Book Fair", "Oktoberfest Ends"],
    10: ["Allerheiligen Markets", "St. Martin's Day Processions"],
    11: ["Christmas Markets Nationwide", "New Year's Eve (Silvester) Berlin"]
};

function updateMonthlyEvents(month) {
    const eventList = document.getElementById('dynamic-event-list');
    if (!eventList) return;

    const events = monthlyEvents2026[month] || [];
    if (events.length > 0) {
        let html = '<ul style="padding-left: 1.2rem; margin-top: 0.5rem;">';
        events.forEach(e => {
            html += `<li style="margin-bottom: 0.5rem; font-weight: 500;">${e}</li>`;
        });
        html += '</ul>';
        eventList.innerHTML = html;
    } else {
        eventList.innerHTML = '<p>No major mega events scheduled for this month.</p>';
    }
}


function getAllHolidaysForState(state) {
    const allHolidays = [];
    for (const [dateStr, name] of Object.entries(nationalHolidays2026)) {
        allHolidays.push({ dateStr, name });
    }
    for (const [dateStr, data] of Object.entries(stateSpecificHolidays2026)) {
        if (state === "ALL" || data.states.includes(state)) {
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
    
    if(!statusWidget) return;

    const holidays = getAllHolidaysForState(selectedState);
    const today = new Date('2026-03-02T00:00:00');
    const todayStr = "03-02";

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

    let nextHoliday = null;
    for (const h of holidays) {
        if (h.dateStr > todayStr) {
            nextHoliday = h;
            break;
        }
    }
    if (!nextHoliday && holidays.length > 0) nextHoliday = holidays[0];

    if (nextHoliday) {
        const [hMonth, hDay] = nextHoliday.dateStr.split('-');
        const nextDate = new Date(2026, parseInt(hMonth)-1, parseInt(hDay));
        const diffTime = Math.abs(nextDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        countdownTimer.textContent = `${diffDays} days`;
        nextHolidayName.textContent = `until ${nextHoliday.name} (${hDay}.${hMonth}.2026)`;
    }
}

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
