/**
 * 외부 HTML 컴포넌트를 비동기적으로 로드하여 지정된 요소에 삽입하는 함수
 * @param {string} url - 불러올 HTML 파일의 경로
 * @param {string} elementId - HTML이 삽입될 요소의 ID
 */
async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        console.log(`Successfully loaded ${url} into #${elementId}`);
    } catch (error) {
        console.error('Error loading component:', error);
        document.getElementById(elementId).innerHTML = `<p style="color:red;">컴포넌트를 불러오는 데 실패했습니다.</p>`;
    }
}

// DOM이 완전히 로드된 후 컴포넌트들을 불러옵니다.
document.addEventListener('DOMContentLoaded', () => {
    // 헤더와 푸터 모듈 로드
    loadComponent('components/header.html', 'header-container');
    loadComponent('components/footer.html', 'footer-container');
    
    // 달력 초기화
    initCalendar();
});

// --- 달력 관련 로직 ---

const nationalHolidays2026 = {
    "01-01": "Neujahr (새해)",
    "04-03": "Karfreitag (성금요일)",
    "04-06": "Ostermontag (부활절 월요일)",
    "05-01": "Tag der Arbeit (노동절)",
    "05-14": "Christi Himmelfahrt (예수 승천일)",
    "05-25": "Pfingstmontag (성령 강림 월요일)",
    "10-03": "Tag der Deutschen Einheit (독일 통일의 날)",
    "12-25": "1. Weihnachtstag (크리스마스)",
    "12-26": "2. Weihnachtstag (성 스테파노의 날)"
};

const stateSpecificHolidays2026 = {
    "01-06": { name: "Heilige Drei Könige", states: ["BW", "BY", "ST"] },
    "03-08": { name: "Frauentag", states: ["BE", "MV"] },
    "04-05": { name: "Ostersonntag", states: ["BB"] },
    "05-24": { name: "Pfingstsonntag", states: ["BB"] },
    "06-04": { name: "Fronleichnam", states: ["BW", "BY", "HE", "NW", "RP", "SL"] },
    "08-15": { name: "Mariä Himmelfahrt", states: ["BY", "SL"] },
    "10-31": { name: "Reformationstag", states: ["BB", "HB", "HH", "MV", "NI", "SH", "SN", "ST", "TH"] },
    "11-01": { name: "Allerheiligen", states: ["BW", "BY", "NW", "RP", "SL"] },
    "11-18": { name: "Buß- und Bettag", states: ["SN"] }
};

let currentYear = 2026;
let currentMonth = 2; // 3월
let selectedState = "ALL";

function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const stateSelect = document.getElementById('stateSelect');
    
    if(!prevBtn || !nextBtn || !stateSelect) return;

    renderCalendar(currentYear, currentMonth);

    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
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
    
    grid.innerHTML = '';
    holidayListUl.innerHTML = '';
    
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    monthDisplay.textContent = `${year}년 ${monthNames[month]}`;

    // 요일 헤더
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 시작 빈 칸
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // 날짜 생성
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        const totalIndex = firstDay + day - 1;
        const weekNum = Math.floor(totalIndex / 7);
        cell.className = `calendar-day week-${weekNum % 6}`;

        const dateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 공휴일 판별
        let holidayName = nationalHolidays2026[dateStr];
        
        // 주별 특수 공휴일 체크
        const stateHoliday = stateSpecificHolidays2026[dateStr];
        if (stateHoliday) {
            if (selectedState === "ALL" || stateHoliday.states.includes(selectedState)) {
                holidayName = holidayName ? `${holidayName} / ${stateHoliday.name}` : stateHoliday.name;
            }
        }

        let content = `<span class="day-num">${day}</span>`;
        if (holidayName) {
            cell.classList.add('holiday-cell');
            content += `<span class="holiday-name">${holidayName}</span>`;
            
            const li = document.createElement('li');
            li.textContent = `${month + 1}월 ${day}일: ${holidayName}`;
            holidayListUl.appendChild(li);
        }

        cell.innerHTML = content;
        grid.appendChild(cell);
    }

    if (holidayListUl.innerHTML === '') {
        holidayListUl.innerHTML = '<li>이달에는 공휴일이 없습니다.</li>';
    }
}
