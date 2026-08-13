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

// if this is set, submitting the form updates that expense instead of creating a new one
let editingExpenseId = null;

// adding or updating an expense
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
      // updating an existing one - no need to touch uid or createdAt
      await updateDoc(doc(db, "expenses", editingExpenseId), expenseData);
      exitEditMode();
    } else {
      // brand new expense
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

// watching for and displaying this user's expenses
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

function renderExpenses(expenses) {
  expenseListEl.innerHTML = "";
  emptyStateEl.style.display = expenses.length === 0 ? "block" : "none";

  for (const expense of expenses) {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${expense.date} - ${expense.category} - £${expense.amount.toFixed(2)} - ${expense.note}`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "edit";
    editBtn.addEventListener("click", () => enterEditMode(expense));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "delete";
    deleteBtn.addEventListener("click", () => handleDelete(expense.id));

    li.appendChild(text);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    expenseListEl.appendChild(li);
  }
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