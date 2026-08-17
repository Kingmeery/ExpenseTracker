import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const expenseForm = document.getElementById("expense-form");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");
const expenseListEl = document.getElementById("expense-list");
const emptyStateEl = document.getElementById("empty-state");
const totalMonthEl = document.getElementById("total-month");
const submitBtn = document.getElementById("expense-submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const currentMonthLabelEl = document.getElementById("current-month-label");
const prevMonthBtn = document.getElementById("prev-month-btn");
const nextMonthBtn = document.getElementById("next-month-btn");
const monthPickerBtn = document.getElementById("month-picker-btn");
const monthPickerPanel = document.getElementById("month-picker-panel");
const pickerPrevYearBtn = document.getElementById("picker-prev-year");
const pickerNextYearBtn = document.getElementById("picker-next-year");
const pickerYearLabel = document.getElementById("picker-year-label");
const pickerMonthGrid = document.getElementById("picker-month-grid");
const pickerTodayBtn = document.getElementById("picker-today-btn");

let editingExpenseId = null;
let allExpenses = [];

const today = new Date();
const realCurrentMonth = today.getMonth();
const realCurrentYear = today.getFullYear();

let viewedMonth = realCurrentMonth;
let viewedYear = realCurrentYear;
let pickerYear = viewedYear;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

if (expenseForm) {
  expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const expenseData = {
      amount: parseFloat(amountInput.value),
      category: categoryInput.value,
      date: dateInput.value,
      note: noteInput.value.trim()
    };

    if (editingExpenseId) {
      await updateDoc(doc(db, "expenses", editingExpenseId), expenseData);
      exitEditMode();
    } else {
      await addDoc(collection(db, "expenses"), {
        ...expenseData,
        uid: user.uid,
        createdAt: Timestamp.now()
      });
    }

    expenseForm.reset();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    exitEditMode();
    expenseForm.reset();
  });
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    viewedMonth -= 1;
    if (viewedMonth < 0) {
      viewedMonth = 11;
      viewedYear -= 1;
    }
    updateView();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    viewedMonth += 1;
    if (viewedMonth > 11) {
      viewedMonth = 0;
      viewedYear += 1;
    }
    updateView();
  });
}

if (monthPickerBtn) {
  monthPickerBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    pickerYear = viewedYear;
    renderPickerPanel();
    monthPickerPanel.hidden = !monthPickerPanel.hidden;
  });
}

document.addEventListener("click", (event) => {
  if (!monthPickerPanel.hidden && !monthPickerPanel.contains(event.target) && event.target !== monthPickerBtn) {
    monthPickerPanel.hidden = true;
  }
});

if (pickerPrevYearBtn) {
  pickerPrevYearBtn.addEventListener("click", () => {
    pickerYear -= 1;
    renderPickerPanel();
  });
}

if (pickerNextYearBtn) {
  pickerNextYearBtn.addEventListener("click", () => {
    pickerYear += 1;
    renderPickerPanel();
  });
}

// jumps straight back to today's real month, from anywhere
if (pickerTodayBtn) {
  pickerTodayBtn.addEventListener("click", () => {
    viewedMonth = realCurrentMonth;
    viewedYear = realCurrentYear;
    monthPickerPanel.hidden = true;
    updateView();
  });
}

function renderPickerPanel() {
  pickerYearLabel.textContent = pickerYear;
  pickerMonthGrid.innerHTML = "";

  monthAbbr.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-month-btn";
    btn.textContent = label;

    const isSelected = index === viewedMonth && pickerYear === viewedYear;
    const isToday = index === realCurrentMonth && pickerYear === realCurrentYear;

    // selected takes priority visually if both are true at once
    if (isSelected) {
      btn.classList.add("is-selected");
    } else if (isToday) {
      btn.classList.add("is-today");
    }

    btn.addEventListener("click", () => {
      viewedMonth = index;
      viewedYear = pickerYear;
      monthPickerPanel.hidden = true;
      updateView();
    });

    pickerMonthGrid.appendChild(btn);
  });
}

function enterEditMode(expense) {
  editingExpenseId = expense.id;

  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  noteInput.value = expense.note;

  submitBtn.textContent = "Update expense";
  cancelEditBtn.style.display = "inline-block";
}

function exitEditMode() {
  editingExpenseId = null;
  submitBtn.textContent = "Add expense";
  cancelEditBtn.style.display = "none";
}

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const expensesRef = collection(db, "expenses");
  const userExpensesQuery = query(
    expensesRef,
    where("uid", "==", user.uid),
    orderBy("date", "desc")
  );

  onSnapshot(userExpensesQuery, (snapshot) => {
    allExpenses = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    updateView();
  });
});

function updateView() {
  if (currentMonthLabelEl) {
    currentMonthLabelEl.textContent = `${monthNames[viewedMonth]} ${viewedYear}`;
  }

  const expensesThisMonth = allExpenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === viewedMonth && expenseDate.getFullYear() === viewedYear;
  });

  renderExpenses(expensesThisMonth);
  renderMonthTotal(expensesThisMonth);
}

function categoryClass(category) {
  return `cat-${category.toLowerCase()}`;
}

function renderExpenses(expenses) {
  expenseListEl.innerHTML = "";
  emptyStateEl.style.display = expenses.length === 0 ? "block" : "none";

  for (const expense of expenses) {
    const li = document.createElement("li");
    li.className = `expense-row ${categoryClass(expense.category)}`;

    const main = document.createElement("div");
    main.className = "expense-main";

    const pill = document.createElement("span");
    pill.className = `expense-pill ${categoryClass(expense.category)}`;
    pill.textContent = expense.category;

    const note = document.createElement("span");
    note.className = "expense-note";
    note.textContent = expense.note || "";

    main.appendChild(pill);
    main.appendChild(note);

    const side = document.createElement("div");
    side.className = "expense-side";

    const date = document.createElement("span");
    date.className = "expense-date";
    date.textContent = formatDate(expense.date);

    const amount = document.createElement("span");
    amount.className = "expense-amount";
    amount.textContent = `£${expense.amount.toFixed(2)}`;

    const editBtn = document.createElement("button");
    editBtn.className = "expense-edit";
    editBtn.innerHTML = '<i class="ti ti-edit" aria-hidden="true"></i>';
    editBtn.addEventListener("click", () => enterEditMode(expense));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "expense-delete";
    deleteBtn.innerHTML = '<i class="ti ti-trash" aria-hidden="true"></i>';
    deleteBtn.addEventListener("click", () => handleDelete(expense.id));

    side.appendChild(date);
    side.appendChild(amount);
    side.appendChild(editBtn);
    side.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(side);
    expenseListEl.appendChild(li);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function renderMonthTotal(expenses) {
  if (!totalMonthEl) return;
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  totalMonthEl.textContent = `£${total.toFixed(2)}`;
}

async function handleDelete(expenseId) {
  await deleteDoc(doc(db, "expenses", expenseId));
}