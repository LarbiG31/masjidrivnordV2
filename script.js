// ── Language Logic ──
function setLang(lang) {
    document.querySelectorAll(`[data-${lang}]`).forEach(el => {
        el.innerText = el.getAttribute(`data-${lang}`);
    });
    document.body.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('prefLang', lang);

    document.querySelectorAll('.lang-switcher button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === lang);
    });

    if (document.getElementById('project-description')) {
        loadProjectData();
    }
}

// ── Donation Progress Bar ──
function updateDonations() {
    const collectedEl = document.getElementById('collected-amount');
    const goalEl = document.getElementById('goal-amount');
    const barEl = document.getElementById('progress-bar');
    const percentEl = document.getElementById('progress-percent');

    if (!collectedEl || !goalEl || !barEl) return;

    fetch(`donation_data.txt?v=${Date.now()}`)
        .then(res => res.text())
        .then(data => {
            const [collected, goal] = data.split(',').map(n => parseFloat(n.trim()));
            if (isNaN(collected) || isNaN(goal) || goal === 0) return;
            const pct = Math.min((collected / goal) * 100, 100);
            collectedEl.innerText = collected.toLocaleString('fr-CA');
            goalEl.innerText = goal.toLocaleString('fr-CA');
            setTimeout(() => { barEl.style.width = pct.toFixed(1) + '%'; }, 100);
            if (percentEl) percentEl.innerText = pct.toFixed(1) + '%';
        })
        .catch(() => console.warn('donation_data.txt not found'));
}

// ── Project Page ──
function loadProjectData() {
    const descEl = document.getElementById('project-description');
    const videoEl = document.getElementById('project-video-iframe');
    const lang = localStorage.getItem('prefLang') || 'fr';

    if (descEl) {
        fetch(`Project/description_${lang}.txt?v=${Date.now()}`)
            .then(res => res.text())
            .then(text => { descEl.innerText = text.trim(); })
            .catch(() => { descEl.innerText = 'Description à venir...'; });
    }

    if (videoEl && !videoEl.src) {
        fetch(`Project/video_url.txt?v=${Date.now()}`)
            .then(res => res.text())
            .then(url => { if (url.trim()) videoEl.src = url.trim(); });
    }
}

// ── Prayer Times via Aladhan API ──
async function loadPrayerTimes() {
    const container = document.getElementById('prayer-times-grid');
    if (!container) return;

    const names = {
        Fajr:    { fr: 'Fajr',    en: 'Fajr',    ar: 'الفجر'   },
        Dhuhr:   { fr: 'Dhuhr',   en: 'Dhuhr',   ar: 'الظهر'   },
        Asr:     { fr: 'Asr',     en: 'Asr',      ar: 'العصر'   },
        Maghrib: { fr: 'Maghrib', en: 'Maghrib', ar: 'المغرب'  },
        Isha:    { fr: 'Isha',    en: 'Isha',    ar: 'العشاء'  },
    };

    try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Saint-Jerome&country=Canada&method=2');
        const json = await res.json();
        const t = json.data.timings;
        const meta = json.data.meta;
        const date = json.data.date;
        const lang = localStorage.getItem('prefLang') || 'fr';

        const dateEl = document.getElementById('prayer-date-gregorian');
        const hijriEl = document.getElementById('prayer-date-hijri');
        if (dateEl) dateEl.innerText = date.readable;
        if (hijriEl) hijriEl.innerText = `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}H`;

        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();

        const prayerMins = prayers.map(p => {
            const [h, m] = t[p].split(':').map(Number);
            return h * 60 + m;
        });

        let nextIndex = prayerMins.findIndex(m => m > nowMins);
        if (nextIndex === -1) nextIndex = 0;

        container.innerHTML = prayers.map((p, i) => {
            const isNext = i === nextIndex;
            const name = names[p][lang] || names[p]['fr'];
            return `
            <div class="prayer-card${isNext ? ' next-prayer' : ''}">
                <div class="prayer-name">${name}</div>
                <div class="prayer-time">${t[p]}</div>
                ${isNext ? '<div class="next-label">↑ prochaine</div>' : ''}
            </div>`;
        }).join('');

    } catch(e) {
        container.innerHTML = '<p style="color:#666;font-size:0.9rem;">Impossible de charger les horaires. Voir le widget ci-dessous.</p>';
    }
}

// ── Mark active nav link ──
function markActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(a => {
        const href = a.getAttribute('href');
        a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
    });
}

// ── Init ──
const initialLang = localStorage.getItem('prefLang') || 'fr';
setLang(initialLang);

window.addEventListener('DOMContentLoaded', () => {
    markActiveNav();
    updateDonations();

    if (document.getElementById('project-description')) {
        loadProjectData();
    }
    if (document.getElementById('prayer-times-grid')) {
        loadPrayerTimes();
    }
});
