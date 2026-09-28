/**
 * Trio Digital — Studi Kasus PABWE Praktikum 3
 * 3 fitur: DompetKu (Expense Tracker), LinkVault (Bookmark Manager), KuisKilat (Quiz App)
 */

/* ========== UTILITAS ========== */

function $(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return el;
}
function $all(selector) {
  return document.querySelectorAll(selector);
}
function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}
function openModal(modal) {
  modal.classList.remove("hidden-panel");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}
function closeModal(modal) {
  modal.classList.add("hidden-panel");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

/* ========== TAB SWITCHER ========== */

const TAB_STORAGE_KEY = "trio-p3-active-tab";
const tabButtons = $all(".tab-btn");
const tabPanels = {
  expense: $("#panel-expense"),
  bookmark: $("#panel-bookmark"),
  quiz: $("#panel-quiz"),
};

function switchTab(name) {
  if (!tabPanels[name]) name = "expense";

  Object.entries(tabPanels).forEach(([key, panel]) => {
    panel.classList.toggle("hidden-panel", key !== name);
  });

  tabButtons.forEach((btn) => {
    const active = btn.dataset.tab === name;
    btn.setAttribute("aria-selected", String(active));
    btn.classList.toggle("bg-indigo-600", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("shadow", active);
    btn.classList.toggle("text-slate-600", !active);
    btn.classList.toggle("hover:bg-slate-100", !active);
  });

  localStorage.setItem(TAB_STORAGE_KEY, name);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

const savedTab = localStorage.getItem(TAB_STORAGE_KEY) || "expense";
switchTab(savedTab);

/* Tutup modal lewat backdrop / tombol X / Batal, dan tombol close umum */
$all("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", () => {
    const name = el.dataset.closeModal;
    const modal = document.getElementById(`modal-${name}`);
    if (modal) closeModal(modal);
    if (name === "edit-expense") editingExpenseId = null;
    if (name === "edit-bookmark") editingBookmarkId = null;
  });
});

/* ======================================================================
   FITUR 1: DOMPETKU (EXPENSE TRACKER)
   ====================================================================== */

const EXPENSE_KEY = "trio-p3-expenses";
let expenses = loadExpenses();
let editingExpenseId = null;
let deletingExpenseId = null;

const expenseForm = $("#expense-form");
const expenseTitle = $("#expense-title");
const expenseCategory = $("#expense-category");
const expenseAmount = $("#expense-amount");
const expenseType = $("#expense-type");
const expenseDate = $("#expense-date");
const expenseError = $("#expense-error");
const expenseSearch = $("#expense-search");
const expenseFilterType = $("#expense-filter-type");
const expenseSort = $("#expense-sort");
const expenseList = $("#expense-list");
const expenseEmpty = $("#expense-empty");

function loadExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveExpenses() {
  localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
}

function updateExpenseSummary() {
  const totalIncome = expenses
    .filter((e) => e.type === "Pemasukan")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalOutcome = expenses
    .filter((e) => e.type === "Pengeluaran")
    .reduce((sum, e) => sum + e.amount, 0);

  $("#expense-total-income").textContent = formatRupiah(totalIncome);
  $("#expense-total-outcome").textContent = formatRupiah(totalOutcome);
  $("#expense-balance").textContent = formatRupiah(totalIncome - totalOutcome);
}

function renderExpenses() {
  const query = expenseSearch.value.trim().toLowerCase();
  const typeFilter = expenseFilterType.value;
  const sort = expenseSort.value;

  let items = expenses.filter((e) => e.title.toLowerCase().includes(query));
  if (typeFilter !== "all") {
    items = items.filter((e) => e.type === typeFilter);
  }

  items = [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.createdAt - b.createdAt;
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "newest":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const noData = expenses.length === 0;
  expenseEmpty.classList.toggle("hidden-panel", !noData);
  expenseList.innerHTML = "";

  if (noData) {
    updateExpenseSummary();
    return;
  }

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600";
    li.textContent = "Tidak ada transaksi yang cocok.";
    expenseList.appendChild(li);
  } else {
    items.forEach((exp) => {
      const li = document.createElement("li");
      li.className = "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 px-4 py-3";

      const info = document.createElement("div");
      info.className = "flex-1 min-w-0";

      const titleEl = document.createElement("p");
      titleEl.className = "font-medium text-slate-900 truncate";
      titleEl.textContent = exp.title;

      const meta = document.createElement("div");
      meta.className = "flex flex-wrap items-center gap-2 mt-1";

      const catBadge = document.createElement("span");
      catBadge.className = "text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700";
      catBadge.textContent = exp.category;

      const typeBadge = document.createElement("span");
      typeBadge.className = `text-xs font-semibold px-2 py-0.5 rounded-md ${
        exp.type === "Pemasukan" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
      }`;
      typeBadge.textContent = exp.type;

      const dateBadge = document.createElement("span");
      dateBadge.className = "text-xs text-slate-500";
      dateBadge.textContent = exp.date;

      meta.append(catBadge, typeBadge, dateBadge);
      info.append(titleEl, meta);

      const amountEl = document.createElement("p");
      amountEl.className = `font-display font-semibold whitespace-nowrap ${
        exp.type === "Pemasukan" ? "text-emerald-700" : "text-rose-700"
      }`;
      amountEl.textContent = (exp.type === "Pemasukan" ? "+ " : "- ") + formatRupiah(exp.amount);

      const actions = document.createElement("div");
      actions.className = "flex items-center gap-1.5 shrink-0";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50";
      editBtn.innerHTML = '<i class="ti ti-pencil"></i> Ubah';
      editBtn.addEventListener("click", () => openEditExpenseModal(exp.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50";
      deleteBtn.innerHTML = '<i class="ti ti-trash"></i> Hapus';
      deleteBtn.addEventListener("click", () => openDeleteExpenseModal(exp.id));

      actions.append(editBtn, deleteBtn);
      li.append(info, amountEl, actions);
      expenseList.appendChild(li);
    });
  }

  updateExpenseSummary();
}

function showExpenseError(message) {
  expenseError.textContent = message;
  expenseError.classList.remove("hidden-panel");
}
function clearExpenseError() {
  expenseError.textContent = "";
  expenseError.classList.add("hidden-panel");
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearExpenseError();

  const title = expenseTitle.value.trim();
  const category = expenseCategory.value;
  const amount = Number(expenseAmount.value);
  const type = expenseType.value;
  const date = expenseDate.value;

  if (!title || !category || !date) {
    showExpenseError("Judul, kategori, dan tanggal wajib diisi.");
    return;
  }
  if (!expenseAmount.value || isNaN(amount) || amount <= 0) {
    showExpenseError("Jumlah harus berupa angka valid dan lebih dari 0.");
    return;
  }

  expenses.push({
    id: crypto.randomUUID(),
    title,
    category,
    amount,
    type,
    date,
    createdAt: Date.now(),
  });

  saveExpenses();
  expenseForm.reset();
  renderExpenses();
});

function openEditExpenseModal(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;
  editingExpenseId = id;
  $("#edit-expense-title").value = exp.title;
  $("#edit-expense-category").value = exp.category;
  $("#edit-expense-amount").value = exp.amount;
  $("#edit-expense-type").value = exp.type;
  $("#edit-expense-date").value = exp.date;
  openModal($("#modal-edit-expense"));
}

function openDeleteExpenseModal(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;
  deletingExpenseId = id;
  $("#delete-expense-title").textContent = `"${exp.title}"`;
  openModal($("#modal-delete-expense"));
}

$("#edit-expense-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!editingExpenseId) return;

  const amount = Number($("#edit-expense-amount").value);
  const title = $("#edit-expense-title").value.trim();
  if (!title || isNaN(amount) || amount <= 0) return;

  const exp = expenses.find((x) => x.id === editingExpenseId);
  if (exp) {
    exp.title = title;
    exp.category = $("#edit-expense-category").value;
    exp.amount = amount;
    exp.type = $("#edit-expense-type").value;
    exp.date = $("#edit-expense-date").value;
    saveExpenses();
    renderExpenses();
  }
  editingExpenseId = null;
  closeModal($("#modal-edit-expense"));
});

$("#delete-expense-confirm").addEventListener("click", () => {
  if (!deletingExpenseId) return;
  expenses = expenses.filter((e) => e.id !== deletingExpenseId);
  saveExpenses();
  renderExpenses();
  deletingExpenseId = null;
  closeModal($("#modal-delete-expense"));
});

expenseSearch.addEventListener("input", renderExpenses);
expenseFilterType.addEventListener("change", renderExpenses);
expenseSort.addEventListener("change", renderExpenses);

renderExpenses();

/* ======================================================================
   FITUR 2: LINKVAULT (BOOKMARK MANAGER)
   ====================================================================== */

const BOOKMARK_KEY = "trio-p3-bookmarks";
let bookmarks = loadBookmarks();
let editingBookmarkId = null;
let deletingBookmarkId = null;

const bookmarkForm = $("#bookmark-form");
const bookmarkName = $("#bookmark-name");
const bookmarkUrl = $("#bookmark-url");
const bookmarkCategory = $("#bookmark-category");
const bookmarkNote = $("#bookmark-note");
const bookmarkError = $("#bookmark-error");
const bookmarkSearch = $("#bookmark-search");
const bookmarkSort = $("#bookmark-sort");
const bookmarkList = $("#bookmark-list");
const bookmarkEmpty = $("#bookmark-empty");

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveBookmarks() {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

/** Validasi URL sederhana: harus diawali http:// atau https:// */
function isValidUrl(url) {
  return /^https?:\/\/.+/i.test(url.trim());
}

function renderBookmarks() {
  const query = bookmarkSearch.value.trim().toLowerCase();
  const sort = bookmarkSort.value;

  let items = bookmarks.filter(
    (b) =>
      b.name.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query)
  );

  items = [...items].sort((a, b) => {
    switch (sort) {
      case "title-asc":
        return a.name.localeCompare(b.name, "id");
      case "title-desc":
        return b.name.localeCompare(a.name, "id");
      case "newest":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const noData = bookmarks.length === 0;
  bookmarkEmpty.classList.toggle("hidden-panel", !noData);
  bookmarkList.innerHTML = "";
  if (noData) return;

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600";
    li.textContent = "Tidak ada bookmark yang cocok.";
    bookmarkList.appendChild(li);
    return;
  }

  items.forEach((bm) => {
    const li = document.createElement("li");
    li.className = "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 px-4 py-3";

    const info = document.createElement("div");
    info.className = "flex-1 min-w-0";

    const link = document.createElement("a");
    link.href = bm.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "font-medium text-sky-700 hover:underline truncate block";
    link.textContent = bm.name;

    const urlEl = document.createElement("p");
    urlEl.className = "text-xs text-slate-500 truncate";
    urlEl.textContent = bm.url;

    const meta = document.createElement("div");
    meta.className = "flex flex-wrap items-center gap-2 mt-1";

    const catBadge = document.createElement("span");
    catBadge.className = "text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800";
    catBadge.textContent = bm.category || "Umum";
    meta.append(catBadge);

    info.append(link, urlEl, meta);

    if (bm.note) {
      const noteEl = document.createElement("p");
      noteEl.className = "text-xs text-slate-500 mt-1 italic";
      noteEl.textContent = bm.note;
      info.append(noteEl);
    }

    const actions = document.createElement("div");
    actions.className = "flex items-center gap-1.5 shrink-0";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50";
    editBtn.innerHTML = '<i class="ti ti-pencil"></i> Ubah';
    editBtn.addEventListener("click", () => openEditBookmarkModal(bm.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50";
    deleteBtn.innerHTML = '<i class="ti ti-trash"></i> Hapus';
    deleteBtn.addEventListener("click", () => openDeleteBookmarkModal(bm.id));

    actions.append(editBtn, deleteBtn);
    li.append(info, actions);
    bookmarkList.appendChild(li);
  });
}

function showBookmarkError(message) {
  bookmarkError.textContent = message;
  bookmarkError.classList.remove("hidden-panel");
}
function clearBookmarkError() {
  bookmarkError.textContent = "";
  bookmarkError.classList.add("hidden-panel");
}

bookmarkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearBookmarkError();

  const name = bookmarkName.value.trim();
  const url = bookmarkUrl.value.trim();
  const category = bookmarkCategory.value.trim();

  if (!name || !url) {
    showBookmarkError("Nama dan URL wajib diisi.");
    return;
  }
  if (!isValidUrl(url)) {
    showBookmarkError("URL harus diawali dengan http:// atau https://");
    return;
  }

  bookmarks.push({
    id: crypto.randomUUID(),
    name,
    url,
    category: category || "Umum",
    note: bookmarkNote.value.trim(),
    createdAt: Date.now(),
  });

  saveBookmarks();
  bookmarkForm.reset();
  renderBookmarks();
});

function openEditBookmarkModal(id) {
  const bm = bookmarks.find((b) => b.id === id);
  if (!bm) return;
  editingBookmarkId = id;
  $("#edit-bookmark-name").value = bm.name;
  $("#edit-bookmark-url").value = bm.url;
  $("#edit-bookmark-category").value = bm.category;
  $("#edit-bookmark-note").value = bm.note || "";
  $("#edit-bookmark-error").classList.add("hidden-panel");
  openModal($("#modal-edit-bookmark"));
}

function openDeleteBookmarkModal(id) {
  const bm = bookmarks.find((b) => b.id === id);
  if (!bm) return;
  deletingBookmarkId = id;
  $("#delete-bookmark-title").textContent = `"${bm.name}"`;
  openModal($("#modal-delete-bookmark"));
}

$("#edit-bookmark-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!editingBookmarkId) return;

  const name = $("#edit-bookmark-name").value.trim();
  const url = $("#edit-bookmark-url").value.trim();
  const errEl = $("#edit-bookmark-error");

  if (!name || !url) {
    errEl.textContent = "Nama dan URL wajib diisi.";
    errEl.classList.remove("hidden-panel");
    return;
  }
  if (!isValidUrl(url)) {
    errEl.textContent = "URL harus diawali dengan http:// atau https://";
    errEl.classList.remove("hidden-panel");
    return;
  }

  const bm = bookmarks.find((b) => b.id === editingBookmarkId);
  if (bm) {
    bm.name = name;
    bm.url = url;
    bm.category = $("#edit-bookmark-category").value.trim() || "Umum";
    bm.note = $("#edit-bookmark-note").value.trim();
    saveBookmarks();
    renderBookmarks();
  }
  editingBookmarkId = null;
  closeModal($("#modal-edit-bookmark"));
});

$("#delete-bookmark-confirm").addEventListener("click", () => {
  if (!deletingBookmarkId) return;
  bookmarks = bookmarks.filter((b) => b.id !== deletingBookmarkId);
  saveBookmarks();
  renderBookmarks();
  deletingBookmarkId = null;
  closeModal($("#modal-delete-bookmark"));
});

bookmarkSearch.addEventListener("input", renderBookmarks);
bookmarkSort.addEventListener("change", renderBookmarks);

renderBookmarks();

/* ======================================================================
   FITUR 3: KUISKILAT (QUIZ APP)
   ====================================================================== */

const QUIZ_HIGHSCORE_KEY = "trio-p3-quiz-highscore";
const QUIZ_TIME_PER_QUESTION = 15; // detik

/** Soal disimpan sebagai array of object (bukan hardcode HTML per soal) */
const QUIZ_QUESTIONS = [
  {
    question: "Tag HTML apa yang digunakan untuk membuat tautan (link)?",
    options: ["<link>", "<a>", "<href>", "<nav>"],
    answer: 1,
  },
  {
    question: "Properti CSS apa yang mengatur warna teks?",
    options: ["background-color", "text-style", "color", "font-color"],
    answer: 2,
  },
  {
    question: "Fungsi JavaScript untuk memilih satu elemen berdasarkan selector CSS adalah?",
    options: ["getElementById()", "querySelector()", "selectElement()", "findElement()"],
    answer: 1,
  },
  {
    question: "Objek browser yang menyimpan data secara permanen (bertahan setelah refresh) adalah?",
    options: ["sessionStorage", "cookie", "localStorage", "cache"],
    answer: 2,
  },
  {
    question: "Method array JavaScript untuk mengubah setiap elemen dan mengembalikan array baru adalah?",
    options: ["forEach()", "map()", "filter()", "reduce()"],
    answer: 1,
  },
];

let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizTimeLeft = QUIZ_TIME_PER_QUESTION;
let quizTimerHandle = null;

const quizStartScreen = $("#quiz-start-screen");
const quizQuestionScreen = $("#quiz-question-screen");
const quizResultScreen = $("#quiz-result-screen");
const quizStartBtn = $("#quiz-start-btn");
const quizRestartBtn = $("#quiz-restart-btn");
const quizNextBtn = $("#quiz-next-btn");
const quizCurrentNum = $("#quiz-current-num");
const quizTotalNum = $("#quiz-total-num");
const quizQuestionText = $("#quiz-question-text");
const quizOptionsWrap = $("#quiz-options");
const quizFeedback = $("#quiz-feedback");
const quizTimerEl = $("#quiz-timer");
const quizTimerBar = $("#quiz-timer-bar");

quizTotalNum.textContent = String(QUIZ_QUESTIONS.length);

function getQuizHighscore() {
  const v = localStorage.getItem(QUIZ_HIGHSCORE_KEY);
  return v ? Number(v) : null;
}
function showQuizHighscore() {
  const top = getQuizHighscore();
  const text = top === null ? "—" : `${top} / ${QUIZ_QUESTIONS.length}`;
  $("#quiz-highscore-start").textContent = text;
  $("#quiz-highscore-end").textContent = text;
}
showQuizHighscore();

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizStartScreen.classList.add("hidden-panel");
  quizResultScreen.classList.add("hidden-panel");
  quizQuestionScreen.classList.remove("hidden-panel");
  renderQuizQuestion();
}

function stopQuizTimer() {
  if (quizTimerHandle) {
    clearInterval(quizTimerHandle);
    quizTimerHandle = null;
  }
}

function startQuizTimer() {
  stopQuizTimer();
  quizTimeLeft = QUIZ_TIME_PER_QUESTION;
  quizTimerEl.textContent = String(quizTimeLeft);
  quizTimerBar.style.width = "100%";

  quizTimerHandle = setInterval(() => {
    quizTimeLeft -= 1;
    quizTimerEl.textContent = String(Math.max(quizTimeLeft, 0));
    quizTimerBar.style.width = `${(quizTimeLeft / QUIZ_TIME_PER_QUESTION) * 100}%`;

    if (quizTimeLeft <= 0) {
      stopQuizTimer();
      if (!quizAnswered) handleQuizAnswer(-1); // waktu habis = tidak menjawab
    }
  }, 1000);
}

function renderQuizQuestion() {
  quizAnswered = false;
  quizFeedback.classList.add("hidden-panel");
  quizNextBtn.classList.add("hidden-panel");

  const q = QUIZ_QUESTIONS[quizIndex];
  quizCurrentNum.textContent = String(quizIndex + 1);
  quizQuestionText.textContent = q.question;

  quizOptionsWrap.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "quiz-option w-full text-left rounded-lg border border-slate-300 px-4 py-2.5 text-sm hover:bg-violet-50 hover:border-violet-300 transition";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleQuizAnswer(idx));
    quizOptionsWrap.appendChild(btn);
  });

  startQuizTimer();
}

function handleQuizAnswer(selectedIdx) {
  if (quizAnswered) return;
  quizAnswered = true;
  stopQuizTimer();

  const q = QUIZ_QUESTIONS[quizIndex];
  const isCorrect = selectedIdx === q.answer;
  if (isCorrect) quizScore += 1;

  const optionButtons = $all(".quiz-option");
  optionButtons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.answer) {
      btn.classList.add("bg-emerald-100", "border-emerald-400", "text-emerald-800");
    } else if (idx === selectedIdx) {
      btn.classList.add("bg-rose-100", "border-rose-400", "text-rose-800");
    }
  });

  quizFeedback.classList.remove("hidden-panel");
  if (isCorrect) {
    quizFeedback.className = "rounded-lg px-3 py-2 mb-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800";
    quizFeedback.textContent = "Benar!";
  } else if (selectedIdx === -1) {
    quizFeedback.className = "rounded-lg px-3 py-2 mb-3 text-sm bg-amber-50 border border-amber-200 text-amber-800";
    quizFeedback.textContent = `Waktu habis. Jawaban benar: ${q.options[q.answer]}`;
  } else {
    quizFeedback.className = "rounded-lg px-3 py-2 mb-3 text-sm bg-rose-50 border border-rose-200 text-rose-800";
    quizFeedback.textContent = `Salah. Jawaban benar: ${q.options[q.answer]}`;
  }

  quizNextBtn.textContent = "";
  const isLast = quizIndex === QUIZ_QUESTIONS.length - 1;
  quizNextBtn.innerHTML = isLast
    ? '<i class="ti ti-flag"></i> Lihat Hasil'
    : 'Lanjut <i class="ti ti-arrow-right"></i>';
  quizNextBtn.classList.remove("hidden-panel");
}

quizNextBtn.addEventListener("click", () => {
  const isLast = quizIndex === QUIZ_QUESTIONS.length - 1;
  if (isLast) {
    finishQuiz();
  } else {
    quizIndex += 1;
    renderQuizQuestion();
  }
});

function finishQuiz() {
  quizQuestionScreen.classList.add("hidden-panel");
  quizResultScreen.classList.remove("hidden-panel");

  $("#quiz-final-score").textContent = `${quizScore} / ${QUIZ_QUESTIONS.length}`;

  const top = getQuizHighscore();
  let message = "Terus berlatih ya!";
  if (top === null || quizScore > top) {
    localStorage.setItem(QUIZ_HIGHSCORE_KEY, String(quizScore));
    message = "Rekor baru! 🎉";
  } else if (quizScore === top) {
    message = "Menyamai rekor terbaikmu!";
  }
  $("#quiz-result-message").textContent = message;
  showQuizHighscore();
}

quizStartBtn.addEventListener("click", startQuiz);
quizRestartBtn.addEventListener("click", startQuiz);

/* Escape menutup modal yang sedang terbuka */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  ["modal-edit-expense", "modal-delete-expense", "modal-edit-bookmark", "modal-delete-bookmark"].forEach((id) => {
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains("hidden-panel")) closeModal(modal);
  });
});
