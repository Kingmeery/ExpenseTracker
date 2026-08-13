import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
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

// adding a new expense
if (expenseForm) {
  expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "expenses"), {
      uid: user.uid,
      amount: parseFloat(amountInput.value),
      category: categoryInput.value,
      date: dateInput.value,
      note: noteInput.value.trim(),
      createdAt: Timestamp.now()
    });

    expenseForm.reset();
  });
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
  });
});

function renderExpenses(expenses) {
  expenseListEl.innerHTML = "";
  emptyStateEl.style.display = expenses.length === 0 ? "block" : "none";

  for (const expense of expenses) {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${expense.date} - ${expense.category} - £${expense.amount.toFixed(2)} - ${expense.note}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "delete";
    deleteBtn.addEventListener("click", () => handleDelete(expense.id));

    li.appendChild(text);
    li.appendChild(deleteBtn);
    expenseListEl.appendChild(li);
  }
}

async function handleDelete(expenseId) {
  await deleteDoc(doc(db, "expenses", expenseId));
}