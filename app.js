(() => {
  'use strict';
  const steps = ['invite', 'date', 'clues', 'riddle', 'final', 'sent'];
  const config = window.INVITE_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const selectedDates = new Set();
  let hints = 0;
  let sending = false;

  function showStep(name) {
    steps.forEach((step) => {
      $(`#${step}-step`).hidden = step !== name;
    });
    $('#progress-fill').style.width = `${(steps.indexOf(name) / (steps.length - 1)) * 100}%`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $(`#${name}-step h1, #${name}-step h2`)?.focus({ preventScroll: true });
  }

  function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^2026-(11|12)-\d{2}$/.test(value)
      || value < '2026-11-20' || value > '2026-12-23') return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function sortedDates() { return [...selectedDates].sort(); }

  function renderDateSummary(container) {
    const dates = sortedDates();
    container.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = dates.length === 1 ? 'Dein Wunschtag:' : 'Deine Wunschtage:';
    const list = document.createElement('ul');
    dates.forEach((date) => {
      const item = document.createElement('li');
      item.textContent = `${formatDate(date)} · Nachmittag und Abend`;
      list.append(item);
    });
    container.append(heading, list);
  }

  function saveDates() {
    try { localStorage.setItem('mami-geburtstag-tage', JSON.stringify(sortedDates())); } catch { /* Dates remain available until reload. */ }
  }

  function renderDates() {
    const list = $('#selected-dates');
    list.replaceChildren();
    const dates = sortedDates();
    $('#date-count').textContent = `${dates.length} ${dates.length === 1 ? 'Tag' : 'Tage'}`;
    if (!dates.length) {
      const empty = document.createElement('li');
      empty.className = 'selected-dates-empty';
      empty.textContent = 'Noch keine Tage ausgewählt.';
      list.append(empty);
      return;
    }
    dates.forEach((date) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = formatDate(date);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-date';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `${formatDate(date)} entfernen`);
      remove.addEventListener('click', () => {
        selectedDates.delete(date);
        saveDates();
        renderDates();
      });
      item.append(label, remove);
      list.append(item);
    });
  }

  function addDate() {
    const date = $('#date-picker').value;
    if (!validDate(date)) {
      $('#date-error').textContent = 'Bitte wähle einen Tag zwischen dem 20.11. und 23.12.2026.';
      $('#date-picker').focus();
      return false;
    }
    if (selectedDates.has(date)) {
      $('#date-error').textContent = 'Dieser Tag ist bereits ausgewählt.';
      return false;
    }
    selectedDates.add(date);
    $('#date-picker').value = '';
    $('#date-error').textContent = '';
    saveDates();
    renderDates();
    return true;
  }

  try {
    const saved = JSON.parse(localStorage.getItem('mami-geburtstag-tage') || '[]');
    if (Array.isArray(saved)) saved.filter(validDate).forEach((date) => selectedDates.add(date));
  } catch { /* Storage can be unavailable in private browsing. */ }
  renderDates();

  try { $('#guess-note').value = localStorage.getItem('mami-geburtstag-vermutung') || ''; } catch { /* Storage can be unavailable in private browsing. */ }
  $('#guess-note').addEventListener('input', () => {
    try { localStorage.setItem('mami-geburtstag-vermutung', $('#guess-note').value); } catch { /* The current page still keeps the note. */ }
  });

  $('#brand').addEventListener('click', (event) => { event.preventDefault(); showStep('invite'); });
  $('#start-button').addEventListener('click', () => showStep('date'));
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showStep(button.dataset.back)));

  $('#add-date').addEventListener('click', addDate);
  $('#date-next').addEventListener('click', () => {
    if ($('#date-picker').value && !addDate()) return;
    if (!selectedDates.size) {
      $('#date-error').textContent = 'Bitte wähle mindestens einen Tag aus.';
      $('#date-picker').focus();
      return;
    }
    $('#date-error').textContent = '';
    showStep('clues');
  });
  $('#date-picker').addEventListener('input', () => { $('#date-error').textContent = ''; });

  const clueCards = [...document.querySelectorAll('.clue-card')];
  clueCards.forEach((card) => card.addEventListener('click', () => {
    const open = card.getAttribute('aria-expanded') === 'true';
    card.setAttribute('aria-expanded', String(!open));
    card.querySelector('small').textContent = open ? 'Antippen zum Aufdecken' : card.dataset.clue;
    $('#clue-counter').textContent = `${clueCards.filter((item) => item.getAttribute('aria-expanded') === 'true').length} / 3`;
  }));
  $('#clues-next').addEventListener('click', () => showStep('riddle'));

  $('#hint-button').addEventListener('click', () => {
    hints += 1;
    const hint = $('#hint-text');
    hint.hidden = false;
    if (hints === 1) hint.textContent = 'Tipp 1: Eine Uhr kann auch für Buchstaben falsch gehen.';
    else if (hints === 2) hint.textContent = 'Tipp 2: Die Zeichen auf Siegel B sind älter, als sie aussehen.';
    else { hint.textContent = 'Tipp 3: Auch ein Regal kann nach einer festen Reihenfolge sortiert sein.'; $('#hint-button').hidden = true; }
  });

  function reveal() {
    const code = $('#lock-code').value.trim();
    const message = $('#riddle-message');
    if (code !== '946') {
      message.textContent = 'Das Schloss bleibt zu. Prüfe die drei Siegel noch einmal.';
      return;
    }
    message.textContent = '';
    renderDateSummary($('#chosen-date'));
    const guess = $('#guess-note').value.trim();
    $('#saved-guess').hidden = !guess;
    $('#saved-guess').textContent = guess ? `Deine Vermutung: ${guess}` : '';
    showStep('final');
  }
  $('#solve-button').addEventListener('click', reveal);
  $('#lock-code').addEventListener('keydown', (event) => { if (event.key === 'Enter') reveal(); });
  $('#lock-code').addEventListener('input', () => { $('#riddle-message').textContent = ''; });
  $('#change-date').addEventListener('click', () => showStep('date'));
  $('#change-note').addEventListener('click', () => showStep('riddle'));

  $('#submit-button').addEventListener('click', async () => {
    if (sending) return;
    const error = $('#submit-error');
    error.textContent = '';
    if (!config.bookingEndpoint) {
      error.textContent = 'Das Abschicken ist noch nicht eingerichtet. Bitte teile deine Wunschtage als Nachricht.';
      return;
    }
    const button = $('#submit-button');
    sending = true;
    button.disabled = true;
    button.textContent = 'Wunschtage werden verschickt …';
    try {
      const dates = sortedDates();
      const response = await fetch(config.bookingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Geburtstagseinladung: Wunschtage von Mami',
          wunschtage: dates.map(formatDate).join('\n'),
          wunschtage_iso: dates.join(', '),
          zeitfenster: 'Jeweils Nachmittag und Abend',
          vermutung: $('#guess-note').value.trim() || 'Keine Vermutung eingetragen',
          _url: window.location.href,
          _honey: ''
        })
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error('FormSubmit hat keine gültige Antwort geschickt. Bitte versuche es erneut oder teile die Tage als Nachricht.'); }
      if (!response.ok || result.success === false || result.success === 'false') {
        const serviceMessage = String(result.message || '');
        if (/activat/i.test(serviceMessage)) throw new Error('FormSubmit braucht noch eine Aktivierung. Bitte prüfe die E-Mail mit dem Aktivierungslink und versuche es danach erneut.');
        if (/web server|html files/i.test(serviceMessage)) throw new Error('FormSubmit erkennt die lokale Seitenadresse noch nicht. Bitte versuche es erneut oder teile die Tage als Nachricht.');
        throw new Error('FormSubmit hat die Nachricht abgelehnt. Bitte versuche es erneut oder teile die Tage als Nachricht.');
      }
      renderDateSummary($('#sent-dates'));
      showStep('sent');
    } catch (cause) {
      error.textContent = cause instanceof TypeError
        ? 'Keine Verbindung zu FormSubmit. Bitte prüfe deine Internetverbindung oder teile die Tage als Nachricht.'
        : cause.message || 'Das Abschicken hat nicht geklappt. Bitte versuche es erneut oder teile die Tage als Nachricht.';
    } finally {
      sending = false;
      button.disabled = false;
      button.innerHTML = 'Wunschtage abschicken <span aria-hidden="true">✉</span>';
    }
  });

  $('#share-button').addEventListener('click', async () => {
    const dates = sortedDates();
    const message = dates.length === 1
      ? `Mein Wunschtag für unser gemeinsames Geburtstagsabenteuer ist ${formatDate(dates[0])}. Ich halte mir den Nachmittag und Abend frei. ♥`
      : `Meine Wunschtage für unser gemeinsames Geburtstagsabenteuer sind ${dates.map(formatDate).join(', ')}. An diesen Tagen halte ich mir jeweils den Nachmittag und Abend frei. ♥`;
    const status = $('#share-status');
    try {
      if (navigator.share) { await navigator.share({ title: 'Unser Geburtstagsabenteuer', text: message }); status.textContent = 'Teilen geöffnet.'; }
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(message); status.textContent = 'Text kopiert – du kannst ihn jetzt verschicken.'; }
      else { status.textContent = message; }
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = message;
    }
  });
})();
