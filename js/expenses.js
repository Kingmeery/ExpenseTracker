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

let editingExpenseId = null;

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
    const expenses = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    renderExpenses(expenses);
    renderMonthTotal(expenses);
  });
});

// turns "Food" into "cat-food", "Subscriptions" into "cat-subscriptions" etc
// so it matches the CSS classes we defined for each category's colour
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

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const total = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  totalMonthEl.textContent = `£${total.toFixed(2)}`;
}

async function handleDelete(expenseId) {
  await deleteDoc(doc(db, "expenses", expenseId));
}