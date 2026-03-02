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
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Auto-detect dark mode preference, fallback to light
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Initialize Seasonal Theme Based on Month
    const currentMonthNum = new Date().getMonth();
    if (currentMonthNum >= 2 && currentMonthNum <= 4) document.body.classList.add('theme-spring');
    else if (currentMonthNum >= 8 && currentMonthNum <= 10) document.body.classList.add('theme-autumn');
    else if (currentMonthNum === 11 || currentMonthNum <= 1) document.body.classList.add('theme-winter');

    loadComponent('components/header.html', 'header-container');
    loadComponent('components/footer.html', 'footer-container');

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }

    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        initCalendar();
        initInteractiveMap();
        initCountdown();
        initBridgeCalculator();
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

    if (!prevBtn || !nextBtn || !stateSelect) return;

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
        updateMapHighlight();
    });
}

function initInteractiveMap() {
    const paths = document.querySelectorAll('#germany-map path');
    paths.forEach(path => {
        path.addEventListener('click', () => {
            const stateId = path.id;
            const stateSelect = document.getElementById('stateSelect');
            if (stateSelect) {
                stateSelect.value = stateId;
                selectedState = stateId;
                renderCalendar(currentYear, currentMonth);
                updateMapHighlight();
            }
        });
    });
    updateMapHighlight();
}

function updateMapHighlight() {
    const paths = document.querySelectorAll('#germany-map path');
    paths.forEach(p => p.classList.remove('active'));

    if (selectedState !== 'ALL') {
        const activePath = document.getElementById(selectedState);
        if (activePath) activePath.classList.add('active');
    }
}

function renderCalendar(year, month) {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('currentMonthDisplay');
    const holidayListUl = document.getElementById('holidays');

    if (!grid || !monthDisplay || !holidayListUl) return;

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
    const lightRed = document.getElementById('light-red');
    const lightYellow = document.getElementById('light-yellow');
    const lightGreen = document.getElementById('light-green');

    if (!detailWidget) return;

    const holidays = getAllHolidaysForState(selectedState);
    const todayDate = new Date(); // Use actual current date for live site, or keep hardcoded 2026-03-02 for testing
    // To properly simulate 2026 holidays based on *today's* real date wouldn't work easily if testing in 2024. 
    // We will use 2026-03-02 as the anchor point based on previous logic for demonstration purposes.
    const today = new Date('2026-03-02T00:00:00');
    const todayStr = "03-02";

    const todayHoliday = holidays.find(h => h.dateStr === todayStr);

    // Reset lights
    [lightRed, lightYellow, lightGreen].forEach(l => {
        if (l) l.classList.remove('active');
    });

    if (todayHoliday) {
        if (statusWidget) {
            statusWidget.textContent = "Yes!";
            statusWidget.style.color = "#ff4d4d";
        }
        detailWidget.textContent = `Today is ${todayHoliday.name}. Most shops are closed.`;
        if (lightRed) lightRed.classList.add('active');
    } else {
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 0) { // Sunday
            if (statusWidget) {
                statusWidget.textContent = "Sunday";
                statusWidget.style.color = "#ffcc00";
            }
            detailWidget.textContent = "It's Sunday. Most retail shops are closed.";
            if (lightYellow) lightYellow.classList.add('active');
        } else {
            if (statusWidget) {
                statusWidget.textContent = "No";
                statusWidget.style.color = "#28a745";
            }
            detailWidget.textContent = "It's a regular working day. Shops are open.";
            if (lightGreen) lightGreen.classList.add('active');
        }
    }

    calculateBridgeDays(); // Update calculation when state changes
}

let countdownInterval;

function initCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    const updateTime = () => {
        const holidays = getAllHolidaysForState(selectedState);
        // Using actual Date.now() for the real countdown effect.
        // If testing specifically for 2026 data, we need the "now" to be progressing.
        const now = new Date();
        const currentYear = now.getFullYear();

        let targetHoliday = null;
        let targetDate = null;

        // Find next holiday in 2026
        for (const h of holidays) {
            const [hMonth, hDay] = h.dateStr.split('-');
            const hDate = new Date(2026, parseInt(hMonth) - 1, parseInt(hDay), 0, 0, 0);
            if (hDate > now) {
                targetHoliday = h;
                targetDate = hDate;
                break;
            }
        }

        // If we passed all 2026 holidays, just grab the last one or stop (edge case for 2026 calendar)
        if (!targetHoliday && holidays.length > 0) {
            targetHoliday = holidays[holidays.length - 1];
            const [hMonth, hDay] = targetHoliday.dateStr.split('-');
            targetDate = new Date(2026, parseInt(hMonth) - 1, parseInt(hDay), 0, 0, 0);
        }

        if (targetHoliday && targetDate) {
            const diffMs = targetDate - now;

            if (diffMs > 0) {
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

                document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
                document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
                document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
                document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');

                const nameEl = document.getElementById('next-holiday-name');
                const dateEl = document.getElementById('next-holiday-date');
                if (nameEl) nameEl.textContent = targetHoliday.name;
                if (dateEl) {
                    const [m, d] = targetHoliday.dateStr.split('-');
                    dateEl.textContent = `${d}.${m}.2026`;
                }
            } else {
                // It is currently a holiday
                document.getElementById('cd-days').textContent = "00";
                document.getElementById('cd-hours').textContent = "00";
                document.getElementById('cd-mins').textContent = "00";
                document.getElementById('cd-secs').textContent = "00";
                document.getElementById('next-holiday-name').textContent = `Today is ${targetHoliday.name}!`;
            }
        }
    };

    updateTime();
    countdownInterval = setInterval(updateTime, 1000);
}

// --- Bridge Day Calculator Logic ---
function initBridgeCalculator() {
    const slider = document.getElementById('leave-slider');
    const valDisplay = document.getElementById('leave-value');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
        valDisplay.textContent = e.target.value;
        calculateBridgeDays();
    });

    calculateBridgeDays();
}

function calculateBridgeDays() {
    const slider = document.getElementById('leave-slider');
    const bestPeriodDiv = document.getElementById('bridge-best-period');
    const resLeave = document.getElementById('res-leave');
    const resTotal = document.getElementById('res-total');
    const resultCard = document.getElementById('bridge-result');

    if (!slider || !bestPeriodDiv) return;

    const requestedLeave = parseInt(slider.value, 10);
    const holidaysForState = getAllHolidaysForState(selectedState).map(h => h.dateStr); // e.g., ["01-01", "04-03", ...]

    // Basic heuristic calculator for 2026
    let bestTotalOff = 0;
    let bestPeriodName = "Try around Easter or May";

    // Static analysis of 2026 known clusters
    // Easter 2026: April 3 (Good Friday), April 6 (Easter Monday)
    // Labor Day: May 1 (Friday)
    // Ascension: May 14 (Thursday) -> Great for 1 day leave
    // Pentecost: May 25 (Monday)
    // Corpus Christi (regional): June 4 (Thursday) -> Great for 1 day leave

    let suggestions = [];

    if (requestedLeave >= 8) {
        suggestions = [
            { total: requestedLeave + 8, text: "Easter Period (Late March - Mid April)" }
        ];
    } else if (requestedLeave >= 4) {
        suggestions = [
            { total: requestedLeave + 5, text: "Easter Week (April)" },
            { total: requestedLeave + 4, text: "Ascension & Pentecost (May)" }
        ];
    } else if (requestedLeave === 1) {
        let oneDayText = "Any Friday/Monday holiday (gets you 4 days)";
        let totalOff = 4;

        if (holidaysForState.includes("05-14")) {
            oneDayText = "May 15th (Friday after Ascension Day)";
        } else if (holidaysForState.includes("06-04")) {
            oneDayText = "June 5th (Friday after Corpus Christi)";
        }
        suggestions = [{ total: 4, text: oneDayText }];
    } else {
        // Fallback generic estimate: you usually gain +2 weekend days for short leave attached to a long weekend
        suggestions = [{ total: requestedLeave + 3, text: "Around Ascension Day or Pentecost" }];
    }

    // Update UI
    const suggestion = suggestions[0];
    bestPeriodDiv.textContent = suggestion.text;
    resLeave.textContent = requestedLeave;
    resTotal.textContent = suggestion.total;

    // Animate change
    resultCard.classList.remove('highlight-result');
    void resultCard.offsetWidth; // trigger reflow
    resultCard.classList.add('highlight-result');
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
