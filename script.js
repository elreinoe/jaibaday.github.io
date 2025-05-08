// --- Configuration & Data ---
const YEAR_TO_DISPLAY = 2025;
let currentMonth = 0; // January (0-indexed)

// Lunar phase data for 2025 (Dates are YYYY-MM-DD format, assumed UTC)
// Source: Manually compiled based on astronomical data (e.g., timeanddate.com)
// NM = New Moon, FQ = First Quarter
const lunarPhases2025 = [
    { type: 'NM', date: '2025-01-29' }, { type: 'FQ', date: '2025-02-05' },
    { type: 'NM', date: '2025-02-27' }, { type: 'FQ', date: '2025-03-06' },
    { type: 'NM', date: '2025-03-28' }, { type: 'FQ', date: '2025-04-05' },
    { type: 'NM', date: '2025-04-26' }, { type: 'FQ', date: '2025-05-04' },
    { type: 'NM', date: '2025-05-26' }, { type: 'FQ', date: '2025-06-03' },
    { type: 'NM', date: '2025-06-25' }, { type: 'FQ', date: '2025-07-02' },
    { type: 'NM', date: '2025-07-24' }, { type: 'FQ', date: '2025-07-31' },
    { type: 'NM', date: '2025-08-22' }, { type: 'FQ', date: '2025-08-30' },
    { type: 'NM', date: '2025-09-21' }, { type: 'FQ', date: '2025-09-28' },
    { type: 'NM', date: '2025-10-21' }, { type: 'FQ', date: '2025-10-28' },
    { type: 'NM', date: '2025-11-19' }, { type: 'FQ', date: '2025-11-26' },
    { type: 'NM', date: '2025-12-19' }, { type: 'FQ', date: '2025-12-26' }
];
// Note: For more accurate perigees and daily illumination, an API like Lunardate is recommended.
// Placeholder for Lunardate API: https://www.lunardate.com/api/

// --- DOM Elements ---
let calendarGrid, monthYearHeader, prevMonthButton, nextMonthButton;

// --- Core Functions ---

// Helper to parse YYYY-MM-DD string to Date object (UTC)
function parseDateUTC(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

// Helper to calculate days between two UTC dates
function daysBetween(date1, date2) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.floor((date2.getTime() - date1.getTime()) / MS_PER_DAY);
}

function getLunarInfo(date) {
    const currentDateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    let phaseType = null;
    let dayInPhase = 0;

    // Check for Waxing Crescent
    for (const phase of lunarPhases2025) {
        if (phase.type === 'NM') {
            const nmDate = parseDateUTC(phase.date);
            const diffDays = daysBetween(nmDate, currentDateUTC);
            if (diffDays >= 0 && diffDays < 7) { // Waxing Crescent typically lasts ~7 days
                phaseType = "Waxing Crescent";
                dayInPhase = diffDays + 1;
                break;
            }
        }
    }

    // Check for Waxing Gibbous (if not Waxing Crescent)
    if (!phaseType) {
        for (const phase of lunarPhases2025) {
            if (phase.type === 'FQ') {
                const fqDate = parseDateUTC(phase.date);
                const diffDays = daysBetween(fqDate, currentDateUTC);
                // Waxing Gibbous typically lasts ~7 days (FQ to Full Moon)
                if (diffDays >= 0 && diffDays < 7) { 
                    phaseType = "Waxing Gibbous";
                    dayInPhase = diffDays + 1;
                    break;
                }
            }
        }
    }
    return { phaseType, dayInPhase };
}


function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function getDayColor(phaseType, dayInPhase) {
    const green = "#4CAF50";
    const red = "#FF5252";

    if (phaseType === "Waxing Crescent") {
        if (dayInPhase <= 0) return null; // Not in phase or invalid
        if (dayInPhase <= 2) return red; // Rojo para días 1-2
        if (dayInPhase >= 3 && dayInPhase <= 4) return green; // Verde días 3-4
        if (dayInPhase <= 6) return interpolateColor(green, red, (dayInPhase - 4) / 2); // Degradado días 5-6
        return red; // Day 7, if phase extends
    }
    
    if (phaseType === "Waxing Gibbous") {
        // Assuming similar "peak" for Jaibas then decline, but different timing
        // Example: peak early in Waxing Gibbous
        if (dayInPhase <= 0) return null;
        if (dayInPhase <= 2) return green; // Verde días 1-2 (assumption for WG)
        if (dayInPhase <= 4) return interpolateColor(green, red, (dayInPhase - 2) / 2); // Degradado días 3-4
        return red; // Days 5-7
    }
    return null; // No specific color
}

function renderCalendar() {
    if (!calendarGrid || !monthYearHeader) return;

    // Animate month header change (simple fade)
    monthYearHeader.classList.add('month-change-exit');
    
    setTimeout(() => {
        calendarGrid.innerHTML = ''; // Clear previous days, keep headers if they are separate DOM
        // Re-add day of week headers (if cleared) or ensure they are present
        const dayHeaders = `
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">LUN</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">MAR</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">MIÉ</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">JUE</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">VIE</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">SÁB</div>
            <div class="font-medium text-center text-xs sm:text-sm text-gray-400 py-2">DOM</div>
        `;
        calendarGrid.innerHTML = dayHeaders;


        const date = new Date(YEAR_TO_DISPLAY, currentMonth, 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
        monthYearHeader.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${YEAR_TO_DISPLAY}`;
        
        monthYearHeader.classList.remove('month-change-exit');
        monthYearHeader.classList.add('month-change-enter');
        setTimeout(() => monthYearHeader.classList.remove('month-change-enter'), 300);


        const firstDayOfMonth = new Date(YEAR_TO_DISPLAY, currentMonth, 1).getDay();
        // Adjust because getDay() is Sun=0, Mon=1... but we want Mon=0
        const dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; 
        const daysInMonth = new Date(YEAR_TO_DISPLAY, currentMonth + 1, 0).getDate();

        // Add empty cells for offset
        for (let i = 0; i < dayOffset; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day', 'bg-gray-700');
            
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayCell.appendChild(dayNumberSpan);

            const jaibaIcon = document.createElement('img');
            jaibaIcon.src = 'jaiba-icon.png';
            jaibaIcon.alt = 'Jaiba';
            jaibaIcon.classList.add('jaiba-icon');
            dayCell.appendChild(jaibaIcon);

            const currentDate = new Date(YEAR_TO_DISPLAY, currentMonth, day);
            const { phaseType, dayInPhase } = getLunarInfo(currentDate);
            const color = getDayColor(phaseType, dayInPhase);

            if (color) {
                dayCell.style.backgroundColor = color;
                if (color === "#4CAF50") { // Green days
                    dayCell.classList.add('high-activity', 'very-high-activity-border');
                    jaibaIcon.classList.add('pulse'); // Add pulse animation to icon
                } else if (color.startsWith("#") && color !== "#FF5252") { // Gradient days
                     dayCell.classList.add('high-activity', 'high-activity-border');
                }
                 if (color !== "#FF5252") { // Make icon visible for non-red special days
                    jaibaIcon.style.opacity = '1';
                }
            } else {
                 dayCell.style.backgroundColor = '#374151'; // Tailwind gray-700
            }
            
            dayCell.addEventListener('click', () => {
                // Jaiba jump animation on click
                dayCell.classList.add('jaiba-jump-animation');
                setTimeout(() => dayCell.classList.remove('jaiba-jump-animation'), 500);
                
                // Placeholder for showing tide data
                // console.log(`Clicked day ${day}, Phase: ${phaseType}, Day in Phase: ${dayInPhase}`);
                // Example: showTideData(currentDate); 
                // Requires WorldTides API integration. See: https://www.worldtides.info/api
            });

            calendarGrid.appendChild(dayCell);
        }
    }, 150); // Match exit animation duration
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) {
        currentMonth = 0; // Stay in Jan 2025
        return; 
    }
    if (currentMonth > 11) {
        currentMonth = 11; // Stay in Dec 2025
        return;
    }
    renderCalendar();
    updateNavButtonStates();
}

function updateNavButtonStates() {
    prevMonthButton.disabled = currentMonth === 0;
    nextMonthButton.disabled = currentMonth === 11;
    prevMonthButton.classList.toggle('opacity-50', currentMonth === 0);
    prevMonthButton.classList.toggle('cursor-not-allowed', currentMonth === 0);
    nextMonthButton.classList.toggle('opacity-50', currentMonth === 11);
    nextMonthButton.classList.toggle('cursor-not-allowed', currentMonth === 11);
}


// --- Initialization ---
export function initCalendar(year) {
    // `year` parameter is kept for future flexibility, but currently fixed to YEAR_TO_DISPLAY
    if (year !== YEAR_TO_DISPLAY) {
        console.warn(`Calendar initialized for ${year}, but data is for ${YEAR_TO_DISPLAY}.`);
    }

    calendarGrid = document.getElementById('calendar-grid');
    monthYearHeader = document.getElementById('month-year-header');
    prevMonthButton = document.getElementById('prev-month');
    nextMonthButton = document.getElementById('next-month');

    if (!calendarGrid || !monthYearHeader || !prevMonthButton || !nextMonthButton) {
        console.error("Calendar UI elements not found!");
        return;
    }
    
    // Set initial month to January of the target year by default
    const today = new Date();
    if (today.getFullYear() === YEAR_TO_DISPLAY) {
        currentMonth = today.getMonth(); // Start with current month if it's 2025
    } else {
        currentMonth = 0; // Otherwise, start with January 2025
    }


    prevMonthButton.addEventListener('click', () => changeMonth(-1));
    nextMonthButton.addEventListener('click', () => changeMonth(1));

    renderCalendar();
    updateNavButtonStates();

    // Placeholder for Push Notification setup (requires Service Worker & backend)
    // function requestNotificationPermission() { ... }

    // Placeholder for Export to CSV functionality
    // function exportCalendarToCSV() { ... }
}

