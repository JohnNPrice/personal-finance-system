// base URL for API
const API = "/api";

// Authentication check - add this at the very beginning
document.addEventListener('DOMContentLoaded', function() {
  const authCheckEl = document.getElementById('authCheck');
  const appContentEl = document.getElementById('appContent');

const form = document.getElementById("expenseForm");
const list = document.getElementById("expensesList");

// display all expenses
async function loadExpenses() {

  const user = JSON.parse(localStorage.getItem('finance_user') || '{}');
  const username = user.username || '';
  
  // Update header to show username
  const header = document.querySelector('h1');
  if (header && username) {
    header.innerHTML = `Personal Finance Suite <span style="font-size: 14px; color: #666; font-weight: normal;">(Logged in as ${username})</span>`;
  }


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



  
  // Check if user is logged in
  const user = localStorage.getItem('finance_user');
  
  if (!user) {
    // Redirect to login
    window.location.href = '/login.html';
    return;
  }
  
  // User is logged in, show the app
  if (authCheckEl) authCheckEl.style.display = 'none';
  if (appContentEl) appContentEl.style.display = 'block';
  
  // Parse user data
  const userData = JSON.parse(user);
  console.log('Logged in as:', userData.username);
  
  // You could display username somewhere if you want
  // For example, add to the header:
  const header = document.querySelector('h1');
  if (header) {
    header.innerHTML = `Personal Finance Suite <small style="font-size: 14px; color: #666;">(${userData.username})</small>`;
  }
});

// Load user profile info
async function loadUserProfile() {
  try {
    const userInfoEl = document.getElementById('userInfo');
    if (!userInfoEl) return;
    
    const user = JSON.parse(localStorage.getItem('finance_user') || '{}');
    
    // Simple display - just show username
    userInfoEl.innerHTML = `Logged in as: <strong>${user.username || 'User'}</strong>`;
    
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Update DOMContentLoaded event in app.js
document.addEventListener('DOMContentLoaded', function() {
  const authCheckEl = document.getElementById('authCheck');
  const appContentEl = document.getElementById('appContent');
  
  // Check if user is logged in
  const user = localStorage.getItem('finance_user');
  
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  // User is logged in, show the app
  if (authCheckEl) authCheckEl.style.display = 'none';
  if (appContentEl) appContentEl.style.display = 'block';
  
  // Load user profile info
  loadUserProfile();
  
  // Load expenses
  loadExpenses();
  
  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      try {
        // Call logout API
        await fetch(`${API}/logout`, { method: 'POST' });
      } catch (error) {
        console.error('Logout API error:', error);
      }
      
      // Clear localStorage and redirect
      localStorage.removeItem('finance_user');
      window.location.href = '/login.html';
    });
  }
});


// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('finance_user');
      window.location.href = '/login.html';
    });
  }
});