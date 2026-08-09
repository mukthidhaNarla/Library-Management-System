import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, AlertTriangle,
  Wallet, Search, Plus, Pencil, Trash2, X, Check, ChevronDown,
  BookMarked, Library, Loader2, Inbox,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

/* ---------------------------------------------------------------------- */
/* THEME — academic ledger / card-catalog aesthetic                       */
/* ---------------------------------------------------------------------- */
const T = {
  ink: "#1B2A4A",
  inkSoft: "#2E4066",
  parchment: "#F6F1E4",
  parchmentDeep: "#EDE4CD",
  card: "#FFFDF8",
  brass: "#A9782F",
  brassDeep: "#8A611F",
  oxblood: "#7A2E33",
  sage: "#4C6B4F",
  charcoal: "#2A2622",
  charcoalSoft: "#5B564B",
  hairline: "#D9CFB4",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');`;

const FINE_RATE = 5; // configurable: rupees per overdue day
const LOAN_DAYS = 14;

const CATEGORIES = ["Technology", "Fiction", "Non-Fiction", "Science", "Biography"];

/* ---------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* ---------------------------------------------------------------------- */
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (n) => `₹${n.toLocaleString("en-IN")}`;

function overdueInfo(issue) {
  if (issue.status === "Returned") {
    const days = Math.max(0, daysBetween(issue.due_date, issue.return_date));
    return { overdueDays: days, fine: days * FINE_RATE };
  }
  const days = Math.max(0, daysBetween(issue.due_date, todayISO()));
  return { overdueDays: days, fine: days * FINE_RATE };
}

/* ---------------------------------------------------------------------- */
/* SEED DATA                                                               */
/* ---------------------------------------------------------------------- */
function buildSeed() {
  const books = [
    { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", total_copies: 4 },
    { title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest & Stein", isbn: "9780262033848", category: "Technology", total_copies: 3 },
    { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", isbn: "9780135957059", category: "Technology", total_copies: 3 },
    { title: "Design Patterns", author: "Gamma, Helm, Johnson & Vlissides", isbn: "9780201633610", category: "Technology", total_copies: 2 },
    { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", isbn: "9780984782857", category: "Technology", total_copies: 5 },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "Non-Fiction", total_copies: 3 },
    { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Non-Fiction", total_copies: 4 },
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "9780374533557", category: "Non-Fiction", total_copies: 2 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Fiction", total_copies: 3 },
    { title: "1984", author: "George Orwell", isbn: "9780451524935", category: "Fiction", total_copies: 4 },
    { title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415", category: "Fiction", total_copies: 3 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Fiction", total_copies: 2 },
    { title: "The Silent Patient", author: "Alex Michaelides", isbn: "9781250301697", category: "Fiction", total_copies: 3 },
    { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "Science", total_copies: 2 },
    { title: "Wings of Fire", author: "A. P. J. Abdul Kalam", isbn: "9788173711466", category: "Biography", total_copies: 3 },
  ].map((b) => ({
    id: uid("bk"),
    ...b,
    available_copies: b.total_copies,
    created_at: todayISO(),
    updated_at: todayISO(),
  }));

  const memberSeed = [
    ["Aditi Sharma", "aditi.sharma@example.edu", "9876500001", "CSE", "CSE21001"],
    ["Rohan Verma", "rohan.verma@example.edu", "9876500002", "ECE", "ECE21014"],
    ["Meera Iyer", "meera.iyer@example.edu", "9876500003", "IT", "IT21027"],
    ["Karan Mehta", "karan.mehta@example.edu", "9876500004", "Mechanical", "ME21033"],
    ["Priya Nair", "priya.nair@example.edu", "9876500005", "Civil", "CE21008"],
    ["Arjun Singh", "arjun.singh@example.edu", "9876500006", "CSE", "CSE21045"],
    ["Sneha Kapoor", "sneha.kapoor@example.edu", "9876500007", "EEE", "EE21019"],
    ["Vikram Rao", "vikram.rao@example.edu", "9876500008", "Biotechnology", "BT21002"],
  ];
  const members = memberSeed.map(([name, email, phone, department, registration_number]) => ({
    id: uid("mb"),
    name, email, phone, department, registration_number,
    created_at: todayISO(),
  }));

  const issues = [];
  const mk = (bookIdx, memberIdx, issuedDaysAgo, returned, returnedDaysAgo) => {
    const issue_date = addDays(todayISO(), -issuedDaysAgo);
    const due_date = addDays(issue_date, LOAN_DAYS);
    const rec = {
      id: uid("is"),
      book_id: books[bookIdx].id,
      member_id: members[memberIdx].id,
      issue_date,
      due_date,
      return_date: null,
      status: "Issued",
      fine_paid: false,
    };
    if (returned) {
      rec.return_date = addDays(todayISO(), -returnedDaysAgo);
      rec.status = "Returned";
      rec.fine_paid = true;
      books[bookIdx].available_copies += 1;
    } else {
      books[bookIdx].available_copies -= 1;
    }
    issues.push(rec);
  };

  // returned, on-time
  mk(0, 0, 20, true, 8);
  mk(5, 1, 30, true, 18);
  mk(9, 2, 25, true, 12);
  // currently issued, not yet due
  mk(1, 3, 5, false);
  mk(6, 4, 3, false);
  // currently issued, overdue
  mk(2, 5, 22, false); // due 8 days ago
  mk(10, 6, 19, false); // due 5 days ago
  mk(13, 7, 30, false); // due 16 days ago, fine unpaid

  return { books, members, issues };
}

/* ---------------------------------------------------------------------- */
/* STORAGE — browser localStorage (swap for a real API/DB call whenever   */
/* you're ready to add a backend; loadState/persist are the only two      */
/* functions you'd need to change).                                      */
/* ---------------------------------------------------------------------- */
const STORAGE_KEY = "library-db";

async function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* corrupted or absent — fall through to seed */
  }
  const seed = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}
async function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

/* ---------------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                                     */
/* ---------------------------------------------------------------------- */
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.kind === "error" ? T.oxblood : T.ink,
            color: T.parchment,
            padding: "10px 16px",
            borderRadius: 4,
            fontFamily: "Inter, sans-serif",
            fontSize: 13.5,
            boxShadow: "0 8px 24px rgba(27,42,74,0.35)",
            minWidth: 220,
            borderLeft: `3px solid ${t.kind === "error" ? "#D98A8F" : T.brass}`,
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: T.charcoalSoft, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ marginTop: 5 }}>{children}</div>
      {error && <div style={{ color: T.oxblood, fontSize: 12, marginTop: 4, fontFamily: "Inter, sans-serif" }}>{error}</div>}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  border: `1px solid ${T.hairline}`,
  borderRadius: 4,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  background: T.card,
  color: T.charcoal,
  outline: "none",
  boxSizing: "border-box",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select({ children, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {children}
    </select>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(27,42,74,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 16 }}
    >
      <div style={{ background: T.card, width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: 6, boxShadow: "0 24px 60px rgba(27,42,74,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.hairline}` }}>
          <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 600, color: T.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.charcoalSoft, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Btn({ children, variant = "primary", ...props }) {
  const styles = {
    primary: { background: T.ink, color: T.parchment, border: `1px solid ${T.ink}` },
    brass: { background: T.brass, color: "#fff", border: `1px solid ${T.brassDeep}` },
    ghost: { background: "transparent", color: T.ink, border: `1px solid ${T.hairline}` },
    danger: { background: "transparent", color: T.oxblood, border: `1px solid ${T.oxblood}` },
  };
  return (
    <button
      {...props}
      style={{
        ...styles[variant],
        fontFamily: "Inter, sans-serif",
        fontSize: 13.5,
        fontWeight: 600,
        padding: "9px 16px",
        borderRadius: 4,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "ink" }) {
  const map = {
    ink: { bg: "rgba(27,42,74,0.08)", fg: T.ink },
    sage: { bg: "rgba(76,107,79,0.12)", fg: T.sage },
    oxblood: { bg: "rgba(122,46,51,0.1)", fg: T.oxblood },
    brass: { bg: "rgba(169,120,47,0.14)", fg: T.brassDeep },
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function ConfirmDialog({ title, body, onCancel, onConfirm, danger }) {
  return (
    <Modal title={title} onClose={onCancel} width={380}>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: T.charcoalSoft, lineHeight: 1.5 }}>{body}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm} style={danger ? { background: T.oxblood, color: "#fff", border: `1px solid ${T.oxblood}` } : {}}>
          Confirm
        </Btn>
      </div>
    </Modal>
  );
}

function EmptyState({ icon: Icon = Inbox, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", color: T.charcoalSoft }}>
      <Icon size={30} style={{ opacity: 0.4, marginBottom: 10 }} />
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: T.ink }}>{title}</div>
      {sub && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatCard({ label, value, tone = "ink", sub }) {
  const toneColor = { ink: T.ink, oxblood: T.oxblood, sage: T.sage, brass: T.brassDeep }[tone];
  return (
    <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, padding: "16px 18px", borderTop: `3px solid ${toneColor}` }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, fontWeight: 600, color: T.charcoalSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: toneColor, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.charcoalSoft, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "10px 14px", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: T.charcoalSoft, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${T.hairline}` };
const tdStyle = { padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: T.charcoal, borderBottom: `1px solid ${T.hairline}` };

/* ---------------------------------------------------------------------- */
/* PAGE: DASHBOARD                                                         */
/* ---------------------------------------------------------------------- */
function Dashboard({ books, members, issues }) {
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const issued = issues.filter((i) => i.status === "Issued");
  const overdue = issued.filter((i) => overdueInfo(i).overdueDays > 0);
  const outstandingFines = issues.filter((i) => !i.fine_paid && overdueInfo(i).fine > 0).reduce((s, i) => s + overdueInfo(i).fine, 0);

  const byCategory = CATEGORIES.map((c) => ({ category: c, copies: books.filter((b) => b.category === c).reduce((s, b) => s + b.total_copies, 0) }));

  const monthly = useMemo(() => {
    const buckets = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short" });
      buckets[key] = { month: key, issued: 0, returned: 0 };
    }
    issues.forEach((i) => {
      const im = new Date(i.issue_date).toLocaleDateString("en-IN", { month: "short" });
      if (buckets[im]) buckets[im].issued += 1;
      if (i.return_date) {
        const rm = new Date(i.return_date).toLocaleDateString("en-IN", { month: "short" });
        if (buckets[rm]) buckets[rm].returned += 1;
      }
    });
    return Object.values(buckets);
  }, [issues]);

  const mostBorrowed = useMemo(() => {
    const counts = {};
    issues.forEach((i) => (counts[i.book_id] = (counts[i.book_id] || 0) + 1));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bookId, count]) => ({ book: books.find((b) => b.id === bookId), count }))
      .filter((r) => r.book);
  }, [issues, books]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Books" value={books.length} />
        <StatCard label="Total Copies" value={totalCopies} />
        <StatCard label="Available Copies" value={availableCopies} tone="sage" />
        <StatCard label="Currently Issued" value={issued.length} tone="brass" />
        <StatCard label="Total Members" value={members.length} />
        <StatCard label="Overdue Books" value={overdue.length} tone="oxblood" />
        <StatCard label="Outstanding Fines" value={money(outstandingFines)} tone="oxblood" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, padding: 18 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, color: T.ink, marginBottom: 12, fontWeight: 600 }}>Monthly Issue / Return Activity</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hairline} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: "Inter" }} stroke={T.charcoalSoft} />
              <YAxis tick={{ fontSize: 12, fontFamily: "Inter" }} stroke={T.charcoalSoft} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 4, border: `1px solid ${T.hairline}` }} />
              <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12 }} />
              <Line type="monotone" dataKey="issued" stroke={T.brass} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="returned" stroke={T.sage} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, padding: 18 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, color: T.ink, marginBottom: 12, fontWeight: 600 }}>Books by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hairline} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "Inter" }} allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11.5, fontFamily: "Inter" }} />
              <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 4, border: `1px solid ${T.hairline}` }} />
              <Bar dataKey="copies" fill={T.ink} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, padding: 18 }}>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, color: T.ink, marginBottom: 10, fontWeight: 600 }}>Most Borrowed Titles</div>
        {mostBorrowed.length === 0 ? (
          <EmptyState title="No borrowing activity yet" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle}>Title</th><th style={thStyle}>Author</th><th style={thStyle}>Times Borrowed</th></tr></thead>
            <tbody>
              {mostBorrowed.map((r) => (
                <tr key={r.book.id}>
                  <td style={tdStyle}>{r.book.title}</td>
                  <td style={tdStyle}>{r.book.author}</td>
                  <td style={tdStyle}><Badge tone="brass">{r.count}×</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAGE: BOOKS                                                             */
/* ---------------------------------------------------------------------- */
function BookForm({ initial, onCancel, onSave, isDuplicateIsbn }) {
  const [form, setForm] = useState(
    initial || { title: "", author: "", isbn: "", category: CATEGORIES[0], total_copies: 1 }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.author.trim()) e.author = "Author is required.";
    if (!form.isbn.trim()) e.isbn = "ISBN is required.";
    else if (isDuplicateIsbn(form.isbn, initial?.id)) e.isbn = "This ISBN already exists.";
    if (!form.total_copies || form.total_copies < 1) e.total_copies = "Must be at least 1.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <Field label="Title" error={errors.title}>
        <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Clean Code" />
      </Field>
      <Field label="Author" error={errors.author}>
        <TextInput value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Robert C. Martin" />
      </Field>
      <Field label="ISBN" error={errors.isbn}>
        <TextInput value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="e.g. 9780132350884" />
      </Field>
      <Field label="Category">
        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Total Copies" error={errors.total_copies}>
        <TextInput
          type="number"
          min={1}
          value={form.total_copies}
          onChange={(e) => setForm({ ...form, total_copies: parseInt(e.target.value || "0", 10) })}
        />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="brass" onClick={() => validate() && onSave(form)}>
          <Check size={14} /> {initial ? "Save Changes" : "Add Book"}
        </Btn>
      </div>
    </div>
  );
}

function BooksPage({ books, issues, onAdd, onEdit, onDelete, pushToast }) {
  const [q, setQ] = useState("");
  const [authorQ, setAuthorQ] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', book}
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isDuplicateIsbn = (isbn, excludeId) => books.some((b) => b.isbn === isbn && b.id !== excludeId);

  const filtered = books.filter((b) => {
    if (q && !b.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (authorQ && !b.author.toLowerCase().includes(authorQ.toLowerCase())) return false;
    if (cat !== "All" && b.category !== cat) return false;
    return true;
  });

  const hasActiveIssue = (bookId) => issues.some((i) => i.book_id === bookId && i.status === "Issued");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: T.charcoalSoft }} />
            <TextInput placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 30, width: 190 }} />
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: T.charcoalSoft }} />
            <TextInput placeholder="Search by author…" value={authorQ} onChange={(e) => setAuthorQ(e.target.value)} style={{ paddingLeft: 30, width: 190 }} />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 160 }}>
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <Btn variant="brass" onClick={() => setModal({ mode: "add" })}><Plus size={15} /> Add Book</Btn>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No books found" sub="Try a different search or add a new title." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>Title</th><th style={thStyle}>Author</th><th style={thStyle}>Category</th>
              <th style={thStyle}>ISBN</th><th style={thStyle}>Total</th><th style={thStyle}>Available</th>
              <th style={thStyle}>Issued</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...tdStyle, fontFamily: "'Source Serif 4', serif", fontWeight: 600, color: T.ink }}>{b.title}</td>
                  <td style={tdStyle}>{b.author}</td>
                  <td style={tdStyle}><Badge tone="ink">{b.category}</Badge></td>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{b.isbn}</td>
                  <td style={tdStyle}>{b.total_copies}</td>
                  <td style={tdStyle}><Badge tone={b.available_copies > 0 ? "sage" : "oxblood"}>{b.available_copies}</Badge></td>
                  <td style={tdStyle}>{b.total_copies - b.available_copies}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button onClick={() => setModal({ mode: "edit", book: b })} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: T.ink, marginRight: 8 }}><Pencil size={15} /></button>
                    <button onClick={() => setConfirmDelete(b)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: T.oxblood }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Book" : "Edit Book"} onClose={() => setModal(null)}>
          <BookForm
            initial={modal.book}
            isDuplicateIsbn={isDuplicateIsbn}
            onCancel={() => setModal(null)}
            onSave={(form) => {
              modal.mode === "add" ? onAdd(form) : onEdit(modal.book.id, form);
              setModal(null);
              pushToast(modal.mode === "add" ? "Book added." : "Book updated.");
            }}
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Book"
          danger
          body={
            hasActiveIssue(confirmDelete.id)
              ? `"${confirmDelete.title}" has active issue records and cannot be deleted until all copies are returned.`
              : `Delete "${confirmDelete.title}" permanently? This cannot be undone.`
          }
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (hasActiveIssue(confirmDelete.id)) {
              pushToast("Cannot delete: book has active issues.", "error");
            } else {
              onDelete(confirmDelete.id);
              pushToast("Book deleted.");
            }
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAGE: MEMBERS                                                           */
/* ---------------------------------------------------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Biotechnology", "Chemical"];

function MemberForm({ initial, onCancel, onSave, isDuplicateReg }) {
  const [form, setForm] = useState(initial || { name: "", email: "", phone: "", department: DEPARTMENTS[0], registration_number: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    if (!form.registration_number.trim()) e.registration_number = "Registration number is required.";
    else if (isDuplicateReg(form.registration_number, initial?.id)) e.registration_number = "This registration number already exists.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <Field label="Name" error={errors.name}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email" error={errors.email}><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Phone" error={errors.phone}><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Department">
        <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </Field>
      <Field label="Registration Number" error={errors.registration_number}>
        <TextInput value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="brass" onClick={() => validate() && onSave(form)}><Check size={14} /> {initial ? "Save Changes" : "Add Member"}</Btn>
      </div>
    </div>
  );
}

function MembersPage({ members, books, issues, onAdd, onEdit, onDelete, pushToast }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [history, setHistory] = useState(null);

  const isDuplicateReg = (reg, excludeId) => members.some((m) => m.registration_number === reg && m.id !== excludeId);
  const hasActiveIssue = (memberId) => issues.some((i) => i.member_id === memberId && i.status === "Issued");

  const filtered = members.filter((m) => {
    const term = q.toLowerCase();
    return !q || m.name.toLowerCase().includes(term) || m.registration_number.toLowerCase().includes(term);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: T.charcoalSoft }} />
          <TextInput placeholder="Search by name or reg. no…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 30, width: 260 }} />
        </div>
        <Btn variant="brass" onClick={() => setModal({ mode: "add" })}><Plus size={15} /> Add Member</Btn>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No members found" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>Name</th><th style={thStyle}>Reg. No.</th><th style={thStyle}>Department</th>
              <th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ ...tdStyle, fontFamily: "'Source Serif 4', serif", fontWeight: 600, color: T.ink, cursor: "pointer" }} onClick={() => setHistory(m)}>{m.name}</td>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{m.registration_number}</td>
                  <td style={tdStyle}><Badge>{m.department}</Badge></td>
                  <td style={tdStyle}>{m.email}</td>
                  <td style={tdStyle}>{m.phone}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button onClick={() => setModal({ mode: "edit", member: m })} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: T.ink, marginRight: 8 }}><Pencil size={15} /></button>
                    <button onClick={() => setConfirmDelete(m)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: T.oxblood }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Member" : "Edit Member"} onClose={() => setModal(null)}>
          <MemberForm
            initial={modal.member}
            isDuplicateReg={isDuplicateReg}
            onCancel={() => setModal(null)}
            onSave={(form) => {
              modal.mode === "add" ? onAdd(form) : onEdit(modal.member.id, form);
              setModal(null);
              pushToast(modal.mode === "add" ? "Member registered." : "Member updated.");
            }}
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Member"
          danger
          body={
            hasActiveIssue(confirmDelete.id)
              ? `${confirmDelete.name} has books currently issued and cannot be removed until they are returned.`
              : `Remove ${confirmDelete.name} from the members list? This cannot be undone.`
          }
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (hasActiveIssue(confirmDelete.id)) {
              pushToast("Cannot delete: member has active issues.", "error");
            } else {
              onDelete(confirmDelete.id);
              pushToast("Member removed.");
            }
            setConfirmDelete(null);
          }}
        />
      )}

      {history && (
        <Modal title={`Borrowing History — ${history.name}`} onClose={() => setHistory(null)} width={560}>
          {(() => {
            const rows = issues.filter((i) => i.member_id === history.id);
            if (rows.length === 0) return <EmptyState title="No borrowing history yet" />;
            return (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={thStyle}>Book</th><th style={thStyle}>Issued</th><th style={thStyle}>Due</th><th style={thStyle}>Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const b = books.find((bk) => bk.id === r.book_id);
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>{b?.title || "—"}</td>
                        <td style={tdStyle}>{fmt(r.issue_date)}</td>
                        <td style={tdStyle}>{fmt(r.due_date)}</td>
                        <td style={tdStyle}><Badge tone={r.status === "Returned" ? "sage" : "brass"}>{r.status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAGE: ISSUE / RETURN                                                    */
/* ---------------------------------------------------------------------- */
function IssueReturnPage({ books, members, issues, onIssue, onReturn, pushToast }) {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Issued");
  const [dateFilter, setDateFilter] = useState("");
  const [confirmReturn, setConfirmReturn] = useState(null);

  const availableBooks = books.filter((b) => b.available_copies > 0);
  const rows = issues
    .filter((i) => (statusFilter === "All" ? true : i.status === statusFilter))
    .filter((i) => !dateFilter || i.issue_date === dateFilter)
    .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            <option>All</option><option>Issued</option><option>Returned</option>
          </Select>
          <TextInput type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: 160 }} />
        </div>
        <Btn variant="brass" onClick={() => setShowIssueModal(true)}><ArrowLeftRight size={15} /> Issue Book</Btn>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No records match this filter" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>Book</th><th style={thStyle}>Member</th><th style={thStyle}>Issue Date</th>
              <th style={thStyle}>Due Date</th><th style={thStyle}>Return Date</th><th style={thStyle}>Status</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const b = books.find((x) => x.id === r.book_id);
                const m = members.find((x) => x.id === r.member_id);
                const info = overdueInfo(r);
                const isOverdue = r.status === "Issued" && info.overdueDays > 0;
                return (
                  <tr key={r.id}>
                    <td style={tdStyle}>{b?.title || "— (deleted)"}</td>
                    <td style={tdStyle}>{m?.name || "— (removed)"}</td>
                    <td style={tdStyle}>{fmt(r.issue_date)}</td>
                    <td style={tdStyle}>{fmt(r.due_date)}</td>
                    <td style={tdStyle}>{fmt(r.return_date)}</td>
                    <td style={tdStyle}>
                      <Badge tone={r.status === "Returned" ? "sage" : isOverdue ? "oxblood" : "brass"}>
                        {r.status === "Returned" ? "Returned" : isOverdue ? "Overdue" : "Issued"}
                      </Badge>
                    </td>
                    <td style={tdStyle}>
                      {r.status === "Issued" && (
                        <Btn variant="ghost" onClick={() => setConfirmReturn(r)} style={{ padding: "5px 10px", fontSize: 12.5 }}>Return</Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showIssueModal && (
        <Modal title="Issue Book" onClose={() => setShowIssueModal(false)}>
          <IssueForm
            books={availableBooks}
            members={members}
            onCancel={() => setShowIssueModal(false)}
            onSubmit={(payload) => {
              onIssue(payload);
              setShowIssueModal(false);
              pushToast("Book issued successfully.");
            }}
          />
        </Modal>
      )}

      {confirmReturn && (() => {
        const info = overdueInfo({ ...confirmReturn, return_date: todayISO() });
        return (
          <ConfirmDialog
            title="Return Book"
            body={
              info.overdueDays > 0
                ? `This book is ${info.overdueDays} day(s) overdue. A fine of ${money(info.fine)} will be recorded.`
                : `Mark this book as returned today (${fmt(todayISO())})?`
            }
            onCancel={() => setConfirmReturn(null)}
            onConfirm={() => {
              onReturn(confirmReturn.id);
              setConfirmReturn(null);
              pushToast("Book returned." + (info.overdueDays > 0 ? ` Fine: ${money(info.fine)}` : ""));
            }}
          />
        );
      })()}
    </div>
  );
}

function IssueForm({ books, members, onCancel, onSubmit }) {
  const [memberId, setMemberId] = useState("");
  const [bookId, setBookId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), LOAN_DAYS));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!memberId) e.memberId = "Select a member.";
    if (!bookId) e.bookId = "Select a book.";
    if (!issueDate) e.issueDate = "Issue date required.";
    if (!dueDate) e.dueDate = "Due date required.";
    else if (new Date(dueDate) < new Date(issueDate)) e.dueDate = "Due date cannot be before issue date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <Field label="Member" error={errors.memberId}>
        <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Select member…</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.registration_number}</option>)}
        </Select>
      </Field>
      <Field label="Book" error={errors.bookId}>
        <Select value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">Select book…</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>)}
        </Select>
        {books.length === 0 && <div style={{ fontSize: 12, color: T.oxblood, marginTop: 4, fontFamily: "Inter" }}>No books currently have available copies.</div>}
      </Field>
      <Field label="Issue Date" error={errors.issueDate}>
        <TextInput type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
      </Field>
      <Field label="Due Date" error={errors.dueDate}>
        <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="brass" onClick={() => validate() && onSubmit({ memberId, bookId, issueDate, dueDate })}>
          <Check size={14} /> Issue Book
        </Btn>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAGE: OVERDUE                                                           */
/* ---------------------------------------------------------------------- */
function OverduePage({ books, members, issues, sortBy, setSortBy }) {
  const rows = issues
    .filter((i) => i.status === "Issued")
    .map((i) => ({ ...i, ...overdueInfo(i) }))
    .filter((i) => i.overdueDays > 0)
    .sort((a, b) => (sortBy === "days" ? b.overdueDays - a.overdueDays : b.fine - a.fine));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} color={T.oxblood} />
          <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: T.ink }}>{rows.length} overdue record{rows.length !== 1 ? "s" : ""}</span>
        </div>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 190 }}>
          <option value="days">Sort by overdue days</option>
          <option value="fine">Sort by fine amount</option>
        </Select>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No overdue books" sub="Everything currently issued is within its due date." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>Book</th><th style={thStyle}>Member</th><th style={thStyle}>Issue Date</th>
              <th style={thStyle}>Due Date</th><th style={thStyle}>Overdue Days</th><th style={thStyle}>Current Fine</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const b = books.find((x) => x.id === r.book_id);
                const m = members.find((x) => x.id === r.member_id);
                return (
                  <tr key={r.id}>
                    <td style={tdStyle}>{b?.title}</td>
                    <td style={tdStyle}>{m?.name}</td>
                    <td style={tdStyle}>{fmt(r.issue_date)}</td>
                    <td style={tdStyle}>{fmt(r.due_date)}</td>
                    <td style={tdStyle}><Badge tone="oxblood">{r.overdueDays} days</Badge></td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: T.oxblood }}>{money(r.fine)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PAGE: FINES                                                             */
/* ---------------------------------------------------------------------- */
function FinesPage({ books, members, issues, onTogglePaid, pushToast }) {
  const rows = issues
    .map((i) => ({ ...i, ...overdueInfo(i) }))
    .filter((i) => i.fine > 0)
    .sort((a, b) => b.fine - a.fine);

  const totalOutstanding = rows.filter((r) => !r.fine_paid).reduce((s, r) => s + r.fine, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Wallet size={18} color={T.brassDeep} />
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: T.ink }}>
          Outstanding fines: <strong style={{ color: T.oxblood }}>{money(totalOutstanding)}</strong>
        </span>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 6, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="No fines on record" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>Book</th><th style={thStyle}>Member</th><th style={thStyle}>Due Date</th>
              <th style={thStyle}>Return Date</th><th style={thStyle}>Overdue Days</th><th style={thStyle}>Fine</th>
              <th style={thStyle}>Status</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const b = books.find((x) => x.id === r.book_id);
                const m = members.find((x) => x.id === r.member_id);
                return (
                  <tr key={r.id}>
                    <td style={tdStyle}>{b?.title}</td>
                    <td style={tdStyle}>{m?.name}</td>
                    <td style={tdStyle}>{fmt(r.due_date)}</td>
                    <td style={tdStyle}>{r.status === "Returned" ? fmt(r.return_date) : "Not yet returned"}</td>
                    <td style={tdStyle}>{r.overdueDays}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{money(r.fine)}</td>
                    <td style={tdStyle}><Badge tone={r.fine_paid ? "sage" : "oxblood"}>{r.fine_paid ? "Paid" : "Unpaid"}</Badge></td>
                    <td style={tdStyle}>
                      <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 12.5 }} onClick={() => { onTogglePaid(r.id); pushToast(r.fine_paid ? "Marked unpaid." : "Marked paid."); }}>
                        {r.fine_paid ? "Mark Unpaid" : "Mark Paid"}
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.charcoalSoft, marginTop: 10 }}>
        Fine rate: {money(FINE_RATE)} per overdue day.
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SHELL                                                                   */
/* ---------------------------------------------------------------------- */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "members", label: "Members", icon: Users },
  { key: "issue", label: "Issue / Return", icon: ArrowLeftRight },
  { key: "overdue", label: "Overdue Books", icon: AlertTriangle },
  { key: "fines", label: "Fines", icon: Wallet },
];

export default function App() {
  const [state, setState] = useState(null); // {books, members, issues}
  const [page, setPage] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [sortOverdueBy, setSortOverdueBy] = useState("days");

  const pushToast = useCallback((msg, kind = "success") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  if (!state) {
    return (
      <div style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: T.parchment, fontFamily: "Inter, sans-serif", color: T.charcoalSoft }}>
        <style>{FONT_IMPORT}</style>
        <Loader2 className="animate-spin" size={22} />
        Loading catalog…
      </div>
    );
  }

  const { books, members, issues } = state;

  /* ---- mutation handlers ---- */
  const addBook = (form) => update((s) => ({
    ...s,
    books: [...s.books, { id: uid("bk"), ...form, available_copies: form.total_copies, created_at: todayISO(), updated_at: todayISO() }],
  }));
  const editBook = (id, form) => update((s) => ({
    ...s,
    books: s.books.map((b) => {
      if (b.id !== id) return b;
      const issuedCount = b.total_copies - b.available_copies;
      const newTotal = Math.max(form.total_copies, issuedCount);
      return { ...b, ...form, total_copies: newTotal, available_copies: newTotal - issuedCount, updated_at: todayISO() };
    }),
  }));
  const deleteBook = (id) => update((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));

  const addMember = (form) => update((s) => ({ ...s, members: [...s.members, { id: uid("mb"), ...form, created_at: todayISO() }] }));
  const editMember = (id, form) => update((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...form } : m)) }));
  const deleteMember = (id) => update((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));

  const issueBook = ({ memberId, bookId, issueDate, dueDate }) => update((s) => ({
    ...s,
    books: s.books.map((b) => (b.id === bookId ? { ...b, available_copies: b.available_copies - 1 } : b)),
    issues: [...s.issues, { id: uid("is"), book_id: bookId, member_id: memberId, issue_date: issueDate, due_date: dueDate, return_date: null, status: "Issued", fine_paid: false }],
  }));
  const returnBook = (issueId) => update((s) => {
    const issue = s.issues.find((i) => i.id === issueId);
    if (!issue || issue.status === "Returned") return s;
    const info = overdueInfo({ ...issue, return_date: todayISO() });
    return {
      ...s,
      books: s.books.map((b) => (b.id === issue.book_id ? { ...b, available_copies: b.available_copies + 1 } : b)),
      issues: s.issues.map((i) => (i.id === issueId ? { ...i, return_date: todayISO(), status: "Returned", fine_paid: info.fine === 0 } : i)),
    };
  });
  const toggleFinePaid = (issueId) => update((s) => ({ ...s, issues: s.issues.map((i) => (i.id === issueId ? { ...i, fine_paid: !i.fine_paid } : i)) }));

  const overdueCount = issues.filter((i) => i.status === "Issued" && overdueInfo(i).overdueDays > 0).length;

  return (
    <div style={{ display: "flex", minHeight: 640, background: T.parchment, fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      {/* SIDEBAR */}
      <div style={{ width: 220, background: T.ink, color: T.parchment, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(246,241,228,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Library size={20} color={T.brass} />
            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 700, letterSpacing: 0.2 }}>Athenaeum</span>
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(246,241,228,0.55)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4 }}>Library Records · Est. Catalog</div>
        </div>
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 3,
                  background: active ? "rgba(169,120,47,0.18)" : "transparent",
                  borderLeft: active ? `3px solid ${T.brass}` : "3px solid transparent",
                  border: "none", borderRadius: 3, cursor: "pointer",
                  color: active ? "#fff" : "rgba(246,241,228,0.75)",
                  fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "left",
                }}
              >
                <Icon size={16} />
                {n.label}
                {n.key === "overdue" && overdueCount > 0 && (
                  <span style={{ marginLeft: "auto", background: T.oxblood, color: "#fff", fontSize: 10.5, padding: "1px 6px", borderRadius: 20, fontFamily: "'IBM Plex Mono', monospace" }}>{overdueCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "14px 20px", fontSize: 11, color: "rgba(246,241,228,0.4)", borderTop: "1px solid rgba(246,241,228,0.12)" }}>
          Data stored in this session's private catalog.
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "18px 28px", borderBottom: `1px solid ${T.hairline}`, background: T.parchmentDeep }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 21, fontWeight: 700, color: T.ink }}>
            {NAV.find((n) => n.key === page)?.label}
          </div>
        </div>
        <div style={{ padding: 26, flex: 1, overflowY: "auto" }}>
          {page === "dashboard" && <Dashboard books={books} members={members} issues={issues} />}
          {page === "books" && (
            <BooksPage books={books} issues={issues} onAdd={addBook} onEdit={editBook} onDelete={deleteBook} pushToast={pushToast} />
          )}
          {page === "members" && (
            <MembersPage members={members} books={books} issues={issues} onAdd={addMember} onEdit={editMember} onDelete={deleteMember} pushToast={pushToast} />
          )}
          {page === "issue" && (
            <IssueReturnPage books={books} members={members} issues={issues} onIssue={issueBook} onReturn={returnBook} pushToast={pushToast} />
          )}
          {page === "overdue" && (
            <OverduePage books={books} members={members} issues={issues} sortBy={sortOverdueBy} setSortBy={setSortOverdueBy} />
          )}
          {page === "fines" && (
            <FinesPage books={books} members={members} issues={issues} onTogglePaid={toggleFinePaid} pushToast={pushToast} />
          )}
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
