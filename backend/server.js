// Import
const express = require("express");
const path = require("path");
const { MongoClient, ObjectId, Decimal128 } = require("mongodb");

const app = express();
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));


const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;


// Connect to Mongo
let db, expensesCol, budgetsCol;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  // DB name is inside URI (/demo)
  db = client.db();
  expensesCol = db.collection("expenses");
  budgetsCol = db.collection("budgets");

  // Indexes
  await expensesCol.createIndex({ date: -1 });
  await expensesCol.createIndex({ category: 1, date: -1 });

  console.log("Connected to MongoDB");
}


// Test
app.get("/api/health", (req, res) => res.json({ ok: true }));


// GET all expenses
app.get("/api/expenses", async (req, res) => {
  const docs = await expensesCol.find({}).sort({ date: -1 }).limit(200).toArray();
  // convert Decimal128 to number/string for frontend
  const mapped = docs.map(d => ({
    ...d,
    _id: d._id.toString(),
    amount: d.amount?.toString?.() ?? d.amount,
    date: d.date ? new Date(d.date).toISOString() : null
  }));
  res.json(mapped);
});

// POST create expense
app.post("/api/expenses", async (req, res) => {
  const { amount, date, category, vendor, note } = req.body;

  if (amount === undefined || amount === null || date === undefined) {
    return res.status(400).json({ error: "amount and date are required" });
  }

  const doc = {
    amount: Decimal128.fromString(String(amount)),
    date: new Date(date),
    category: category || "Uncategorized",
    vendor: vendor || "",
    note: note || ""
  };

  const result = await expensesCol.insertOne(doc);
  res.status(201).json({ _id: result.insertedId.toString() });
});

// DELETE expense
app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  await expensesCol.deleteOne({ _id: new ObjectId(id) });
  res.json({ ok: true });
});

// GET budgets
app.get("/api/budgets", async (req, res) => {
  const docs = await budgetsCol.find({}).toArray();
  const mapped = docs.map(d => ({
    ...d,
    _id: d._id.toString(),
    budget_amount: d.budget_amount?.toString?.() ?? d.budget_amount
  }));
  res.json(mapped);
});

// POST set budget (upsert by category)
app.post("/api/budgets", async (req, res) => {
  const { budget_category, budget_amount } = req.body;
  if (!budget_category || budget_amount === undefined || budget_amount === null) {
    return res.status(400).json({ error: "budget_category and budget_amount are required" });
  }

  await budgetsCol.updateOne(
    { budget_category },
    { $set: { budget_category, budget_amount: Decimal128.fromString(String(budget_amount)) } },
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
