// base URL for API
const API = "/api";

const form = document.getElementById("expenseForm");
const list = document.getElementById("expensesList");

// display all expenses
async function loadExpenses() {
  const res = await fetch(`${API}/expenses`);
  const expenses = await res.json();

  list.innerHTML = "";
  expenses.forEach(e => {
    const li = document.createElement("li");
    const d = e.date ? e.date.slice(0, 10) : "";
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <div>
          <strong>${Number(e.amount).toFixed(2)}€</strong>
          <span>• ${d}</span>
          <div style="font-size:12px;opacity:.8">${e.category || ""} ${e.vendor ? "• " + e.vendor : ""}</div>
          <div style="font-size:12px;opacity:.7">${e.note || ""}</div>
        </div>
        <button data-id="${e._id}">Delete</button>
      </div>
    `;
    li.querySelector("button").addEventListener("click", async () => {
      await fetch(`${API}/expenses/${e._id}`, { method: "DELETE" });
      loadExpenses();
    });
    list.appendChild(li);
  });
}

// add new expense
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const vendor = document.getElementById("vendor").value;
  const note = document.getElementById("notes").value;

  await fetch(`${API}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, date, category, vendor, note })
  });

  form.reset();
  loadExpenses();
});

loadExpenses();
