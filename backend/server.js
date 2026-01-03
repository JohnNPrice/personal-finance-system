const express = require("express");
const path = require("path");
const { MongoClient, ObjectId, Decimal128 } = require("mongodb");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// Session middleware
app.use(session({
  secret: 'finance-system-secret-key-2024', // Change this in production!
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to Mongo
let db, expensesCol, budgetsCol, usersCol;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  
  db = client.db();
  expensesCol = db.collection("expenses");
  budgetsCol = db.collection("budgets");
  usersCol = db.collection("users");

  // Indexes for better performance
  await expensesCol.createIndex({ user_id: 1, date: -1 });
  await expensesCol.createIndex({ user_id: 1, category: 1 });
  await budgetsCol.createIndex({ user_id: 1, budget_category: 1 });

  console.log("Connected to MongoDB");
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Debug endpoint to see users
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await usersCol.find({}).toArray();
    res.json(users.map(u => ({
      _id: u._id.toString(),
      username: u.user_name,
      password_length: u.user_password?.length || 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  
  try {
    const user = await usersCol.findOne({ user_name: username });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check password (support both plain text and bcrypt)
    let passwordValid = false;
    
    if (user.user_password && user.user_password.startsWith('$2b$')) {
      // Password is hashed with bcrypt
      passwordValid = await bcrypt.compare(password, user.user_password);
    } else {
      // Password is plain text
      passwordValid = (password === user.user_password);
      
      // Hash and update password on successful login
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCol.updateOne(
          { _id: user._id },
          { $set: { user_password: hashedPassword } }
        );
      }
    }
    
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Update last login time
    await usersCol.updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );
    
    // Store user info in session
    req.session.userId = user._id.toString();
    req.session.username = user.user_name;
    
    res.json({
      _id: user._id.toString(),
      username: user.user_name,
      last_login: user.last_login
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// Registration endpoint
app.post("/api/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  // Validation
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  
  // Check for alphanumeric username (simplified)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ 
      error: "Username can only contain letters, numbers, and underscores" 
    });
  }
  
  try {
    // Check if username already exists
    const existingUser = await usersCol.findOne({ user_name: username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken" });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user document (simplified, no TOS field)
    const newUser = {
      user_name: username,
      user_password: hashedPassword,
      created_at: new Date(),
      last_login: null
    };
    
    // Insert into database
    const result = await usersCol.insertOne(newUser);
    
    // Auto-login after registration
    req.session.userId = result.insertedId.toString();
    req.session.username = username;
    
    res.status(201).json({
      _id: result.insertedId.toString(),
      username: username,
      message: "Registration successful"
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Check if username is available
app.get("/api/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.json({ available: false, error: "Username too short" });
    }
    
    const existingUser = await usersCol.findOne({ user_name: username });
    
    res.json({
      available: !existingUser,
      username: username
    });
    
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user profile
app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const userId = new ObjectId(req.session.userId);
    const user = await usersCol.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user info without password
    res.json({
      _id: user._id.toString(),
      username: user.user_name,
      created_at: user.created_at,
      last_login: user.last_login,
      role: user.role || "user"
    });
    
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update last login time
app.post("/api/update-last-login", requireAuth, async (req, res) => {
  try {
    const userId = new ObjectId(req.session.userId);
    
    await usersCol.updateOne(
      { _id: userId },
      { $set: { last_login: new Date() } }
    );
    
    res.json({ ok: true });
    
  } catch (error) {
    console.error("Update last login error:", error);
    res.status(500).json({ error: "Failed to update login time" });
  }
});

// Check auth status
app.get("/api/check-auth", (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true,
      username: req.session.username 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// GET all expenses for current user
app.get("/api/expenses", requireAuth, async (req, res) => {
  try {
    // Convert string ID to ObjectId
    const userId = new ObjectId(req.session.userId);
    
    const docs = await expensesCol
      .find({ user_id: userId })  // Now comparing ObjectId to ObjectId
      .sort({ date: -1 })
      .limit(200)
      .toArray();
    
    // convert Decimal128 to number/string for frontend
    const mapped = docs.map(d => ({
      ...d,
      _id: d._id.toString(),
      amount: d.amount?.toString?.() ?? d.amount,
      date: d.date ? new Date(d.date).toISOString() : null,
      user_id: d.user_id?.toString?.() // Convert user_id to string too if needed
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST create expense
app.post("/api/expenses", requireAuth, async (req, res) => {
  const { amount, date, category, vendor, note } = req.body;
  
  if (amount === undefined || amount === null || date === undefined) {
    return res.status(400).json({ error: "amount and date are required" });
  }
  
  const doc = {
    amount: Decimal128.fromString(String(amount)),
    date: new Date(date),
    category: category || "Uncategorized",
    vendor: vendor || "",
    note: note || "",
    user_id: new ObjectId(req.session.userId),  // Store as ObjectId, not string
    created_at: new Date()
  };
  
  const result = await expensesCol.insertOne(doc);
  res.status(201).json({ _id: result.insertedId.toString() });
});

// DELETE expense
app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Convert string IDs to ObjectId
    const expenseId = new ObjectId(id);
    const userId = new ObjectId(req.session.userId);
    
    const expense = await expensesCol.findOne({ 
      _id: expenseId,
      user_id: userId  // Now comparing ObjectId to ObjectId
    });
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found or not authorized" });
    }
    
    await expensesCol.deleteOne({ 
      _id: expenseId,
      user_id: userId
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// GET budgets for current user
app.get("/api/budgets", requireAuth, async (req, res) => {
  const userId = new ObjectId(req.session.userId);
  
  const docs = await budgetsCol
    .find({ user_id: userId })
    .toArray();
  
  const mapped = docs.map(d => ({
    ...d,
    _id: d._id.toString(),
    budget_amount: d.budget_amount?.toString?.() ?? d.budget_amount,
    user_id: d.user_id?.toString?.()
  }));
  
  res.json(mapped);
});

// POST set budget - FIXED
app.post("/api/budgets", requireAuth, async (req, res) => {
  const { budget_category, budget_amount } = req.body;
  
  if (!budget_category || budget_amount === undefined || budget_amount === null) {
    return res.status(400).json({ error: "budget_category and budget_amount are required" });
  }
  
  const userId = new ObjectId(req.session.userId);
  
  await budgetsCol.updateOne(
    { 
      budget_category, 
      user_id: userId
    },
    { 
      $set: { 
        budget_category, 
        budget_amount: Decimal128.fromString(String(budget_amount)),
        user_id: userId
      } 
    },
    { upsert: true }
  );
  
  res.json({ ok: true });
});

// POST set budget
app.post("/api/budgets", requireAuth, async (req, res) => {
  const { budget_category, budget_amount } = req.body;
  
  if (!budget_category || budget_amount === undefined || budget_amount === null) {
    return res.status(400).json({ error: "budget_category and budget_amount are required" });
  }
  
  await budgetsCol.updateOne(
    { 
      budget_category, 
      user_id: req.session.userId 
    },
    { 
      $set: { 
        budget_category, 
        budget_amount: Decimal128.fromString(String(budget_amount)),
        user_id: req.session.userId
      } 
    },
    { upsert: true }
  );
  
  res.json({ ok: true });
});


// Server start
connectMongo()
  .then(() => app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)))
  .catch(err => {
    console.error("Mongo connection failed:", err);
    process.exit(1);
  });