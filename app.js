/* Habit Tracker — tracks up to 10 habits across every day of the current month,
   weekends included. All data lives in localStorage under a single key. */

var STORAGE_KEY = 'habitTracker.v1';
var MAX_HABITS = 10;

/* Colour assigned to each habit, in the order habits are created. */
var PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#06b6d4'
];

/* Ready-made ideas shown as chips; the user can add them as-is and rename them later. */
var SUGGESTIONS = [
  'Drink 2L of water',
  'Read 20 minutes',
  'Walk 10,000 steps',
  '10 min stretching',
  'No phone after 22:00',
  'Write in journal',
  'Meditate 10 minutes',
  'Tidy desk before leaving'
];

var DOW_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
var DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
var MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

var monthDate = getCurrentMonth();
var monthKey = formatMonthKey(monthDate);
var monthDays = getMonthDays(monthDate);
var store = loadStore();
var habits = store[monthKey] || [];

/* Returns a Date set to the first day of the month we are currently in,
   so that today always appears somewhere in the calendar. */
function getCurrentMonth() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/* Turns a Date into a "YYYY-MM" key used to group habits by month in storage. */
function formatMonthKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

/* Turns a Date into a "YYYY-MM-DD" key used to record a single day's mark. */
function formatDayKey(date) {
  return date.getFullYear() +
    '-' + String(date.getMonth() + 1).padStart(2, '0') +
    '-' + String(date.getDate()).padStart(2, '0');
}

/* Lists every date in the given month, weekends included. */
function getMonthDays(firstOfMonth) {
  var year = firstOfMonth.getFullYear();
  var month = firstOfMonth.getMonth();
  var days = [];
  var cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/* Tells whether a date falls on a Saturday or Sunday. */
function isWeekend(date) {
  var dow = date.getDay();
  return dow === 0 || dow === 6;
}

/* Reads the saved data out of localStorage, returning an empty object if there is none or it is unreadable. */
function loadStore() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

/* Writes the current month's habits back to localStorage. */
function saveStore() {
  store[monthKey] = habits;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    /* Storage may be full or blocked (e.g. private browsing); the app still works for this session. */
  }
}

/* Picks the first palette colour that no existing habit is using. */
function pickColor() {
  var used = habits.map(function (habit) { return habit.color; });
  for (var i = 0; i < PALETTE.length; i++) {
    if (used.indexOf(PALETTE[i]) === -1) {
      return PALETTE[i];
    }
  }
  return PALETTE[habits.length % PALETTE.length];
}

/* Adds a new habit if the name is non-empty and the 10-habit limit has not been reached. */
function addHabit(name) {
  var trimmed = name.trim();
  if (!trimmed || habits.length >= MAX_HABITS) {
    return;
  }
  habits.push({
    id: 'h' + Date.now() + Math.floor(Math.random() * 1000),
    name: trimmed,
    color: pickColor(),
    days: {}
  });
  saveStore();
  render();
}

/* Removes a habit and all of its marks. */
function removeHabit(id) {
  habits = habits.filter(function (habit) { return habit.id !== id; });
  saveStore();
  render();
}

/* Finds a habit by its id. */
function findHabit(id) {
  return habits.filter(function (habit) { return habit.id === id; })[0];
}

/* Counts how many days a habit is currently marked as done. */
function countDone(habit) {
  return monthDays.filter(function (day) { return habit.days[formatDayKey(day)]; }).length;
}

/* Marks or unmarks one habit on one day, updating just that square and the row's score. */
function toggleMark(button) {
  var habit = findHabit(button.dataset.habit);
  if (!habit) {
    return;
  }
  var dayKey = button.dataset.day;

  if (habit.days[dayKey]) {
    delete habit.days[dayKey];
    button.classList.remove('done');
  } else {
    habit.days[dayKey] = true;
    button.classList.add('done');
  }

  var score = document.querySelector('.score[data-habit="' + habit.id + '"]');
  if (score) {
    score.textContent = countDone(habit) + '/' + monthDays.length;
  }
  saveStore();
}

/* Builds the month heading, today's date, the suggestion chips, the counter and the habit grid. */
function render() {
  document.getElementById('monthLabel').textContent =
    'Tracking ' + MONTH_NAMES[monthDate.getMonth()] + ' ' + monthDate.getFullYear() +
    ' · ' + monthDays.length + ' days';

  renderToday();
  renderCounter();
  renderChips();
  renderGrid();
}

/* Shows today's date, so it is clear which day the app was opened on. */
function renderToday() {
  var today = new Date();
  document.getElementById('todayLabel').textContent =
    'Today · ' + DAY_NAMES[today.getDay()] + ', ' + today.getDate() +
    ' ' + MONTH_NAMES[today.getMonth()] + ' ' + today.getFullYear();
}

/* Shows how many of the 10 habit slots are used and disables the form when full. */
function renderCounter() {
  var full = habits.length >= MAX_HABITS;
  document.getElementById('slotCounter').textContent = full
    ? 'All 10 habit slots are used — remove one to add another.'
    : habits.length + ' of ' + MAX_HABITS + ' habits added.';

  document.getElementById('habitInput').disabled = full;
  document.getElementById('addButton').disabled = full;
}

/* Draws the suggestion chips, greying out ones already added or blocked by the limit. */
function renderChips() {
  var chips = document.getElementById('chips');
  var names = habits.map(function (habit) { return habit.name.toLowerCase(); });
  chips.innerHTML = '';

  SUGGESTIONS.forEach(function (suggestion) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = suggestion;
    chip.disabled = habits.length >= MAX_HABITS || names.indexOf(suggestion.toLowerCase()) !== -1;
    chip.addEventListener('click', function () { addHabit(suggestion); });
    chips.appendChild(chip);
  });
}

/* Draws the whole grid: a header row of weekday dates, then one row per habit. */
function renderGrid() {
  var grid = document.getElementById('grid');
  var todayKey = formatDayKey(new Date());
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = 'auto repeat(' + monthDays.length + ', 30px)';

  document.getElementById('emptyState').classList.toggle('hidden', habits.length > 0);

  if (!habits.length) {
    return;
  }

  grid.appendChild(buildCell('cell head-cell corner'));

  monthDays.forEach(function (day) {
    var head = buildCell('cell head-cell' +
      (day.getDay() === 1 ? ' week-start' : '') +
      (isWeekend(day) ? ' weekend' : '') +
      (formatDayKey(day) === todayKey ? ' today' : ''));
    head.innerHTML = '<span class="dow">' + DOW_LETTERS[day.getDay()] + '</span>' +
      '<span class="num">' + day.getDate() + '</span>';
    grid.appendChild(head);
  });

  habits.forEach(function (habit) {
    grid.appendChild(buildNameCell(habit));

    monthDays.forEach(function (day) {
      var dayKey = formatDayKey(day);
      var cell = buildCell('cell row-tint' +
        (day.getDay() === 1 ? ' week-start' : '') +
        (isWeekend(day) ? ' weekend' : '') +
        (dayKey === todayKey ? ' today' : ''));

      var mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'mark' + (habit.days[dayKey] ? ' done' : '');
      mark.style.setProperty('--habit-color', habit.color);
      mark.dataset.habit = habit.id;
      mark.dataset.day = dayKey;
      mark.title = habit.name + ' — ' + day.getDate() + ' ' + MONTH_NAMES[day.getMonth()];
      mark.setAttribute('aria-label', mark.title);

      cell.appendChild(mark);
      grid.appendChild(cell);
    });
  });

  scrollTodayIntoView();
}

/* Scrolls the grid sideways so today's column is on screen when the app opens. */
function scrollTodayIntoView() {
  var scroller = document.querySelector('.grid-scroll');
  var todayCell = document.querySelector('.head-cell.today');
  if (!scroller || !todayCell) {
    return;
  }
  var offset = todayCell.offsetLeft - (scroller.clientWidth / 2);
  scroller.scrollLeft = Math.max(0, offset);
}

/* Creates an empty grid cell with the given classes. */
function buildCell(className) {
  var cell = document.createElement('div');
  cell.className = className;
  return cell;
}

/* Creates the pinned left-hand cell holding a habit's colour dot, editable name, score and delete button. */
function buildNameCell(habit) {
  var cell = buildCell('cell name-cell');

  var dot = document.createElement('span');
  dot.className = 'dot';
  dot.style.background = habit.color;

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'name-input';
  input.value = habit.name;
  input.maxLength = 40;
  input.dataset.habit = habit.id;
  input.setAttribute('aria-label', 'Habit name');

  var score = document.createElement('span');
  score.className = 'score';
  score.dataset.habit = habit.id;
  score.textContent = countDone(habit) + '/' + monthDays.length;

  var remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove';
  remove.textContent = '×';
  remove.title = 'Remove habit';
  remove.setAttribute('aria-label', 'Remove ' + habit.name);
  remove.addEventListener('click', function () { removeHabit(habit.id); });

  cell.appendChild(dot);
  cell.appendChild(input);
  cell.appendChild(score);
  cell.appendChild(remove);
  return cell;
}

/* Wires up the add form, day squares and inline renaming, then draws the app. */
function init() {
  document.getElementById('addForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = document.getElementById('habitInput');
    addHabit(input.value);
    input.value = '';
  });

  var grid = document.getElementById('grid');

  grid.addEventListener('click', function (event) {
    if (event.target.classList.contains('mark')) {
      toggleMark(event.target);
    }
  });

  grid.addEventListener('input', function (event) {
    if (event.target.classList.contains('name-input')) {
      var habit = findHabit(event.target.dataset.habit);
      if (habit) {
        habit.name = event.target.value;
        saveStore();
      }
    }
  });

  grid.addEventListener('focusout', function (event) {
    if (event.target.classList.contains('name-input') && !event.target.value.trim()) {
      var habit = findHabit(event.target.dataset.habit);
      if (habit) {
        habit.name = 'Untitled habit';
        event.target.value = habit.name;
        saveStore();
        renderChips();
      }
    }
  });

  render();
}

init();
