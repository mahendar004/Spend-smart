import { useState } from 'react'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wallet,
  X
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { CATEGORIES, filterTransactions, load, money, persist, today, totals } from './finance'
import './App.css'

const nav = ['Overview', 'Transactions', 'Budgets', 'Reports']
const palette = [
  '#059669',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#f97316',
  '#06b6d4',
  '#84cc16'
]

const fmtMonth = d => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        {payload.map((item, idx) => (
          <div key={idx} className="custom-tooltip-row">
            <span>
              <i className="chart-legend-dot" style={{ background: item.color }} />
              {item.name}
            </span>
            <strong>{money(item.value)}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-row">
          <span>
            <i className="chart-legend-dot" style={{ background: item.payload?.fill || '#059669' }} />
            {item.name}
          </span>
          <strong>{money(item.value)}</strong>
        </div>
      </div>
    )
  }
  return null
}

function Header({ page, month, changeMonth, setMobile }) {
  return (
    <header className="topbar">
      <button className="icon mobile-menu" onClick={() => setMobile(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="crumb">
        Workspace <span>/</span> <b>{page}</b>
      </div>
      <div className="top-actions">
        <div className="month">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <CalendarDays size={16} className="month-icon" />
          <span>{fmtMonth(month)}</span>
          <button onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <button className="icon" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge" />
        </button>
        <div className="avatar" title="Personal Workspace">Y</div>
      </div>
    </header>
  )
}

function Stat({ icon: Icon, label, value, note, theme = 'balance' }) {
  return (
    <article className="card stat">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon ${theme}`}>
          <Icon size={18} />
        </div>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function Empty({ title, text, button }) {
  return (
    <div className="empty">
      <div className="empty-icon-wrap">
        <Wallet size={22} />
      </div>
      <b>{title}</b>
      <span>{text}</span>
      {button}
    </div>
  )
}

function TxRow({ x, onEdit }) {
  return (
    <div className="tx-row">
      <div className={`tx-icon ${x.type}`}>
        {x.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>
      <div className="tx-title">
        <b>{x.description}</b>
        <small>{x.category} · {x.date}</small>
      </div>
      <strong className={`tx-amount ${x.type}`}>
        {x.type === 'income' ? '+' : '−'}{money(x.amount)}
      </strong>
      <button className="icon" onClick={() => onEdit(x.type, x)} aria-label="Edit transaction">
        <Pencil size={15} />
      </button>
    </div>
  )
}

function App() {
  const [data, setData] = useState(load)
  const [page, setPage] = useState('Overview')
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [modal, setModal] = useState('')
  const [edit, setEdit] = useState(null)
  const [type, setType] = useState('expense')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('All')
  const [cat, setCat] = useState('All')
  const [period, setPeriod] = useState('All months')
  const [sort, setSort] = useState('Newest first')
  const [toast, setToast] = useState('')
  const [mobile, setMobile] = useState(false)

  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const tx = data.transactions
  const current = tx.filter(x => x.date.slice(0, 7) === key)
  const sum = totals(current)
  const budget = data.budgets[key] || { total: 0, categories: {} }
  const spent = current.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0)

  const say = s => {
    setToast(s)
    setTimeout(() => setToast(''), 2400)
  }

  const save = d => {
    setData(d)
    if (!persist(d)) say('Browser storage is unavailable; changes will not persist.')
  }

  const changeMonth = n => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  const open = (t = 'expense', x = null) => {
    setType(t)
    setEdit(x)
    setModal('tx')
  }

  const rows = filterTransactions(tx, {
    query: q,
    type: kind === 'All' ? 'All' : kind,
    category: cat,
    month: period === 'All months' ? period : key,
    sort
  })

  const groups = CATEGORIES.expense
    .map(category => ({
      category,
      value: current.filter(x => x.type === 'expense' && x.category === category).reduce((s, x) => s + x.amount, 0)
    }))
    .filter(x => x.value)
    .sort((a, b) => b.value - a.value)

  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(month.getFullYear(), month.getMonth() - 5 + i, 1)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const t = totals(tx.filter(x => x.date.slice(0, 7) === k))
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      Income: t.income,
      Expenses: t.expense
    }
  })

  function submitTx(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const amount = Number(f.get('amount'))
    const description = String(f.get('description')).trim()
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return say('Enter a description and positive amount.')
    }
    const item = {
      id: edit?.id || crypto.randomUUID(),
      description,
      amount: Math.round(amount * 100) / 100,
      type,
      category: f.get('category'),
      date: f.get('date'),
      notes: String(f.get('notes') || '').trim()
    }
    save({
      ...data,
      transactions: edit ? tx.map(x => (x.id === item.id ? item : x)) : [item, ...tx]
    })
    setModal('')
    say(edit ? 'Transaction updated.' : 'Transaction added.')
  }

  function remove(x) {
    if (confirm(`Delete “${x.description}”?`)) {
      save({
        ...data,
        transactions: tx.filter(t => t.id !== x.id)
      })
      say('Transaction deleted.')
    }
  }

  function submitBudget(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const categories = {}
    CATEGORIES.expense.forEach(c => {
      const n = +f.get(c)
      if (n > 0) categories[c] = n
    })
    save({
      ...data,
      budgets: {
        ...data.budgets,
        [key]: {
          total: Math.max(0, +f.get('total') || 0),
          categories
        }
      }
    })
    setModal('')
    say('Monthly budget saved.')
  }

  function csv() {
    const s = [
      ['Date', 'Description', 'Type', 'Category', 'Amount', 'Notes'],
      ...tx.map(x => [x.date, x.description, x.type, x.category, x.amount, x.notes || ''])
    ]
      .map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv' }))
    a.download = 'spendsmart.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function backup() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = 'spendsmart-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function restore(e) {
    try {
      const d = JSON.parse(await e.target.files[0].text())
      if (
        !Array.isArray(d.transactions) ||
        !d.budgets ||
        d.transactions.some(
          x => !x.id || !x.description || !Number.isFinite(+x.amount) || +x.amount <= 0 || !['income', 'expense'].includes(x.type)
        )
      ) {
        throw new Error('Invalid schema')
      }
      save({ version: 1, transactions: d.transactions, budgets: d.budgets })
      say('Backup imported.')
    } catch {
      say('Invalid backup. Existing data is unchanged.')
    }
    e.target.value = ''
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${mobile ? 'show' : ''}`}>
        <div className="brand">
          <div className="brand-icon-wrap">
            <Wallet size={20} />
          </div>
          <div className="brand-text">
            <span className="title">spend<span>smart</span></span>
            <span className="badge">Personal Finance</span>
          </div>
          <button className="icon close" onClick={() => setMobile(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="section-label">
          <span>Workspace</span>
        </div>

        {nav.map((n, i) => {
          const Icons = [LayoutDashboard, Activity, Target, Sparkles]
          const Icon = Icons[i]
          return (
            <button
              key={n}
              className={`nav ${page === n ? 'chosen' : ''}`}
              onClick={() => {
                setPage(n)
                setMobile(false)
              }}
            >
              <Icon size={18} />
              <span>{n}</span>
              {n === 'Transactions' && <span className="nav-count">{tx.length}</span>}
            </button>
          )
        })}

        <div className="side-bottom">
          <div className="side-card">
            <div className="side-card-icon">
              <Sparkles size={17} />
            </div>
            <b>Financial Clarity</b>
            <p>Your money, organized with precision in one place.</p>
            <button className="link" onClick={() => setPage('Reports')}>
              Explore insights ↗
            </button>
          </div>

          <button className="nav" onClick={() => setModal('settings')}>
            <Settings2 size={18} />
            <span>Settings & Backup</span>
          </button>

          <div className="profile">
            <div className="avatar">Y</div>
            <div className="profile-info">
              <b>Your Workspace</b>
              <small>
                <span className="status-dot" /> Local Storage Active
              </small>
            </div>
          </div>
        </div>
      </aside>

      {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Close menu backdrop" />}

      <main className="main">
        <Header page={page} month={month} changeMonth={changeMonth} setMobile={setMobile} />
        <div className="content">
          <div className="page-head">
            <div>
              <div className="page-head-eyebrow">
                {page === 'Overview' ? 'FINANCIAL OVERVIEW' : page === 'Transactions' ? 'RECORDS & LEDGER' : page === 'Budgets' ? 'PLANNING & TARGETS' : 'ANALYTICS & SUMMARY'}
              </div>
              <h1>
                {page === 'Overview'
                  ? 'Good morning.'
                  : page === 'Transactions'
                  ? 'Transactions'
                  : page === 'Budgets'
                  ? 'Your monthly plan'
                  : 'Your financial story'}
              </h1>
              <p>
                {page === 'Overview'
                  ? 'Here’s how your finances look for this month.'
                  : page === 'Transactions'
                  ? 'Search, filter, and inspect all recorded income and expenses.'
                  : page === 'Budgets'
                  ? 'Set target spending limits to stay comfortably on track.'
                  : 'A clear perspective on your income, expenses, and long-term habits.'}
              </p>
            </div>
            <button className="primary" onClick={() => (page === 'Budgets' ? setModal('budget') : open('expense'))}>
              <Plus size={16} />
              <span>{page === 'Budgets' ? 'Set budget' : 'Add transaction'}</span>
            </button>
          </div>

          {page === 'Overview' && (
            <>
              <div className="stats">
                <Stat
                  icon={Wallet}
                  label="TOTAL BALANCE"
                  value={money(sum.income - sum.expense)}
                  note="Income minus expenses"
                  theme="balance"
                />
                <Stat
                  icon={ArrowDownLeft}
                  label="INCOME"
                  value={money(sum.income)}
                  note={`Earned in ${fmtMonth(month)}`}
                  theme="income"
                />
                <Stat
                  icon={ArrowUpRight}
                  label="SPENDING"
                  value={money(sum.expense)}
                  note={`Spent in ${fmtMonth(month)}`}
                  theme="expense"
                />
                <Stat
                  icon={Activity}
                  label="SAVINGS RATE"
                  value={sum.income ? `${Math.round(((sum.income - sum.expense) / sum.income) * 100)}%` : '—'}
                  note={sum.income ? 'Of monthly total income' : 'Add income to calculate'}
                  theme="rate"
                />
              </div>

              <div className="columns">
                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Cash flow</h2>
                      <p>Income vs. expenses over time</p>
                    </div>
                    <span className="card-title-pill">Last 6 months</span>
                  </div>

                  <div className="chart-legend">
                    <div className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: '#059669' }} />
                      <span>Income</span>
                    </div>
                    <div className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Expenses</span>
                    </div>
                  </div>

                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={x => (x >= 1000 ? `₹${x / 1000}k` : x)}
                        />
                        <Tooltip content={<CustomAreaTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Income"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fill="url(#incomeGlow)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Expenses"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          fill="url(#expenseGlow)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Where it goes</h2>
                      <p>Spending by category</p>
                    </div>
                    <button className="link" onClick={() => setPage('Reports')}>
                      Details ↗
                    </button>
                  </div>
                  {groups.length ? (
                    <>
                      <div className="donut">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={groups}
                              dataKey="value"
                              nameKey="category"
                              innerRadius="65%"
                              outerRadius="90%"
                              paddingAngle={3}
                            >
                              {groups.map((x, i) => (
                                <Cell key={x.category} fill={palette[i % palette.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-label">
                          <b>{money(sum.expense)}</b>
                          <small>Total spent</small>
                        </div>
                      </div>
                      <div className="cat-legend">
                        {groups.slice(0, 5).map((x, i) => (
                          <div key={x.category} className="cat-legend-row">
                            <span className="cat-legend-label">
                              <i className="cat-legend-dot" style={{ background: palette[i % palette.length] }} />
                              {x.category}
                            </span>
                            <b>{money(x.value)}</b>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty title="No spending yet" text="Your category breakdown will show here once you record expenses." />
                  )}
                </article>
              </div>

              <div className="columns lower">
                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Recent transactions</h2>
                      <p>Your latest money moves</p>
                    </div>
                    <button className="link" onClick={() => setPage('Transactions')}>
                      See all ↗
                    </button>
                  </div>
                  {current.length ? (
                    <div className="tx-list">
                      {[...current]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 5)
                        .map(x => (
                          <TxRow key={x.id} x={x} onEdit={open} />
                        ))}
                    </div>
                  ) : (
                    <Empty
                      title="A fresh start"
                      text="Add a transaction to start building your ledger."
                      button={
                        <button className="link" onClick={() => open()}>
                          Add your first transaction →
                        </button>
                      }
                    />
                  )}
                </article>

                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Monthly budget</h2>
                      <p>A little plan goes a long way</p>
                    </div>
                    <button className="icon" onClick={() => setModal('budget')} aria-label="Configure budget">
                      <Target size={18} />
                    </button>
                  </div>
                  {budget.total ? (
                    <>
                      <div className="budget-total">
                        <b>{money(spent)}</b> of {money(budget.total)}
                      </div>
                      <div className="progress">
                        <i
                          className={spent >= budget.total ? 'over' : spent / budget.total >= 0.8 ? 'near' : ''}
                          style={{ width: `${Math.min(100, (spent / budget.total) * 100)}%` }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span
                          className={`budget-status-tag ${
                            spent >= budget.total ? 'over' : spent / budget.total >= 0.8 ? 'near' : 'normal'
                          }`}
                        >
                          {spent >= budget.total
                            ? 'Budget exceeded'
                            : spent / budget.total >= 0.8
                            ? 'Approaching limit'
                            : 'Looking good'}
                        </span>
                        <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                          {Math.round(Math.min(100, (spent / budget.total) * 100))}% used
                        </small>
                      </div>
                    </>
                  ) : (
                    <Empty
                      title="Set a monthly limit"
                      text="Choose a comfortable spending budget for this month."
                      button={
                        <button className="link" onClick={() => setModal('budget')}>
                          Create a budget →
                        </button>
                      }
                    />
                  )}
                </article>
              </div>
            </>
          )}

          {page === 'Transactions' && (
            <article className="card history">
              <div className="filters">
                <label className="filters-search">
                  <Search size={16} />
                  <input
                    placeholder="Search transactions by description or notes…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                  />
                </label>
                <select aria-label="Filter type" value={kind} onChange={e => setKind(e.target.value)}>
                  <option value="All">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>
                <select aria-label="Filter category" value={cat} onChange={e => setCat(e.target.value)}>
                  <option value="All">All categories</option>
                  {[...new Set([...CATEGORIES.income, ...CATEGORIES.expense])].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select aria-label="Filter month" value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="All months">All months</option>
                  <option value="Selected month">Selected month</option>
                </select>
                <select aria-label="Sort transactions" value={sort} onChange={e => setSort(e.target.value)}>
                  <option>Newest first</option>
                  <option>Oldest first</option>
                  <option>Highest amount</option>
                  <option>Lowest amount</option>
                </select>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={() => {
                    setQ('')
                    setKind('All')
                    setCat('All')
                    setPeriod('All months')
                    setSort('Newest first')
                  }}
                >
                  Clear filters
                </button>
                <button className="secondary" onClick={csv}>
                  <Download size={15} /> CSV
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th>CATEGORY</th>
                      <th>DATE</th>
                      <th>TYPE</th>
                      <th className="right">AMOUNT</th>
                      <th className="right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(x => (
                      <tr key={x.id}>
                        <td>
                          <b>{x.description}</b>
                          {x.notes && <small>{x.notes}</small>}
                        </td>
                        <td>
                          <span className="category-tag">{x.category}</span>
                        </td>
                        <td>{x.date}</td>
                        <td>
                          <span className={`type-tag ${x.type}`}>
                            {x.type === 'income' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                            {x.type}
                          </span>
                        </td>
                        <td className={`right table-amount ${x.type}`}>
                          {x.type === 'income' ? '+' : '−'}{money(x.amount)}
                        </td>
                        <td className="right">
                          <div className="table-actions">
                            <button className="icon" onClick={() => open(x.type, x)} aria-label="Edit">
                              <Pencil size={15} />
                            </button>
                            <button className="icon delete" onClick={() => remove(x)} aria-label="Delete">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <Empty title="Nothing to show" text="Try changing your search term or filter parameters." />
              )}
              <div className="table-foot">
                <span>{rows.length} transactions recorded</span>
                <span>All amounts displayed in INR (₹)</span>
              </div>
            </article>
          )}

          {page === 'Budgets' && (
            <>
              <article className="card budget-hero">
                <small>{fmtMonth(month).toUpperCase()} PLAN</small>
                <h2>{budget.total ? money(Math.max(0, budget.total - spent)) : 'A plan that fits your life.'}</h2>
                <p>
                  {budget.total
                    ? 'left to spend from your monthly budget'
                    : 'Set a comfortable limit and keep an eye on things you care about.'}
                </p>
                <button className="primary" onClick={() => setModal('budget')}>
                  <Target size={16} />
                  <span>{budget.total ? 'Edit your budget' : 'Create a budget'}</span>
                </button>
              </article>

              <div className="stats budget-stats">
                <Stat
                  icon={Target}
                  label="MONTHLY LIMIT"
                  value={budget.total ? money(budget.total) : 'Not set'}
                  note={fmtMonth(month)}
                  theme="balance"
                />
                <Stat
                  icon={ArrowUpRight}
                  label="SPENT SO FAR"
                  value={money(spent)}
                  note="This month"
                  theme="expense"
                />
                <Stat
                  icon={Wallet}
                  label="REMAINING"
                  value={budget.total ? money(Math.max(0, budget.total - spent)) : '—'}
                  note="In your plan"
                  theme="income"
                />
              </div>

              <article className="card chart-card">
                <div className="card-title">
                  <div>
                    <h2>Category budgets</h2>
                    <p>Keep an eye on the areas you planned for</p>
                  </div>
                  <button className="link" onClick={() => setModal('budget')}>
                    Edit categories ↗
                  </button>
                </div>
                {Object.entries(budget.categories || {}).length ? (
                  Object.entries(budget.categories).map(([c, limit], i) => {
                    const n = current.filter(x => x.type === 'expense' && x.category === c).reduce((s, x) => s + x.amount, 0)
                    const p = limit ? Math.min(100, (n / limit) * 100) : 0
                    const status = p >= 100 ? 'over' : p >= 80 ? 'near' : 'normal'
                    return (
                      <div className="budget-row" key={c}>
                        <i className="budget-dot" style={{ background: palette[i % palette.length] }} />
                        <div className="budget-info">
                          <div className="budget-info-head">
                            <b>{c}</b>
                            <small>{money(n)} of {money(limit)}</small>
                          </div>
                          <div className="progress">
                            <i
                              className={p >= 100 ? 'over' : p >= 80 ? 'near' : ''}
                              style={{ width: `${p}%` }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`budget-status-tag ${status}`}>
                              {p >= 100 ? 'Over budget' : p >= 80 ? 'Approaching limit' : 'On track'}
                            </span>
                            <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                              {Math.round(p)}% used
                            </small>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <Empty
                    title="No category budgets yet"
                    text="Add category limits to make your spending plan more specific."
                    button={
                      <button className="primary" onClick={() => setModal('budget')}>
                        Add category limits
                      </button>
                    }
                  />
                )}
              </article>
            </>
          )}

          {page === 'Reports' && (
            <>
              <div className="stats">
                <Stat
                  icon={ArrowDownLeft}
                  label="PERIOD INCOME"
                  value={money(sum.income)}
                  note={fmtMonth(month)}
                  theme="income"
                />
                <Stat
                  icon={ArrowUpRight}
                  label="PERIOD EXPENSES"
                  value={money(sum.expense)}
                  note={fmtMonth(month)}
                  theme="expense"
                />
                <Stat
                  icon={Wallet}
                  label="NET SAVINGS"
                  value={money(sum.income - sum.expense)}
                  note="Income minus expenses"
                  theme="balance"
                />
                <Stat
                  icon={Activity}
                  label="SAVINGS RATE"
                  value={sum.income ? `${Math.round(((sum.income - sum.expense) / sum.income) * 100)}%` : '—'}
                  note="Of monthly income"
                  theme="rate"
                />
              </div>

              <div className="columns">
                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Monthly comparison</h2>
                      <p>Six month income and expenses trend</p>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: '#059669' }} />
                      <span>Income</span>
                    </div>
                    <div className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Expenses</span>
                    </div>
                  </div>
                  <div className="chart tall">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="reportIncomeGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="reportExpenseGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={x => (x >= 1000 ? `₹${x / 1000}k` : x)}
                        />
                        <Tooltip content={<CustomAreaTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Income"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fill="url(#reportIncomeGlow)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Expenses"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          fill="url(#reportExpenseGlow)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="card chart-card">
                  <div className="card-title">
                    <div>
                      <h2>Spending breakdown</h2>
                      <p>{fmtMonth(month)}</p>
                    </div>
                  </div>
                  {groups.length ? (
                    <div className="report-legend">
                      {groups.map((x, i) => {
                        const proportion = sum.expense ? Math.min(100, (x.value / sum.expense) * 100) : 0
                        return (
                          <div key={x.category} className="report-item">
                            <div className="report-item-header">
                              <span className="cat-legend-label">
                                <i className="cat-legend-dot" style={{ background: palette[i % palette.length] }} />
                                <b>{x.category}</b>
                              </span>
                              <span>
                                <strong>{money(x.value)}</strong>
                                <small style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
                                  ({Math.round(proportion)}%)
                                </small>
                              </span>
                            </div>
                            <div className="report-progress-bar">
                              <div
                                className="report-progress-fill"
                                style={{
                                  width: `${proportion}%`,
                                  background: palette[i % palette.length]
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty title="No spending to report" text="Expense insights will show up here once recorded." />
                  )}
                </article>
              </div>

              <div className="privacy-note">
                <ShieldCheck size={20} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                <span>
                  Reports and analytics are generated purely from records saved in this browser profile for {fmtMonth(month)}. No data ever leaves your device.
                </span>
              </div>
            </>
          )}

          <footer>
            <span>Made with precision for financial clarity ✳</span>
            <span>Private by design · All data stored locally in this browser</span>
          </footer>
        </div>
      </main>

      {modal === 'tx' && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setModal('')}>
          <form className="modal" onSubmit={submitTx}>
            <div className="modal-head">
              <div>
                <small>TRANSACTION ENTRY</small>
                <h2>{edit ? 'Edit transaction' : 'Add a transaction'}</h2>
                <p>Record your income or everyday expenses.</p>
              </div>
              <button type="button" className="icon" onClick={() => setModal('')} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <div className="tabs">
              <button
                type="button"
                className={type === 'expense' ? 'sel exp' : ''}
                onClick={() => setType('expense')}
              >
                <ArrowUpRight size={16} /> Expense
              </button>
              <button
                type="button"
                className={type === 'income' ? 'sel inc' : ''}
                onClick={() => setType('income')}
              >
                <ArrowDownLeft size={16} /> Income
              </button>
            </div>

            <label>
              Description
              <input
                name="description"
                required
                maxLength={80}
                placeholder="e.g. Weekend groceries, Salary, Coffee"
                defaultValue={edit?.description}
                autoFocus
              />
            </label>

            <label>
              Amount (₹)
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                defaultValue={edit?.amount}
              />
            </label>

            <div className="pair">
              <label>
                Category
                <select name="category" defaultValue={edit?.category || CATEGORIES[type][0]} key={type}>
                  {CATEGORIES[type].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input name="date" type="date" defaultValue={edit?.date || today()} required />
              </label>
            </div>

            <label>
              Notes <small>OPTIONAL</small>
              <textarea
                name="notes"
                maxLength={250}
                rows={2}
                placeholder="Add optional notes, invoice numbers, or context…"
                defaultValue={edit?.notes}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal('')}>
                Cancel
              </button>
              <button className="primary" type="submit">
                {edit ? 'Save changes' : 'Add transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'budget' && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setModal('')}>
          <form className="modal budget-modal" onSubmit={submitBudget}>
            <div className="modal-head">
              <div>
                <small>FINANCIAL TARGET</small>
                <h2>Monthly budget plan</h2>
                <p>Set spending targets for {fmtMonth(month)}.</p>
              </div>
              <button type="button" className="icon" onClick={() => setModal('')} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <label>
              Total monthly spending limit (₹)
              <input
                name="total"
                type="number"
                min="0"
                step="0.01"
                defaultValue={budget.total || ''}
                placeholder="e.g. 35000"
                autoFocus
              />
            </label>

            <div className="field-title">
              Category Limits <small>OPTIONAL</small>
            </div>

            <div className="budget-fields">
              {CATEGORIES.expense.map(c => (
                <label key={c}>
                  {c}
                  <input
                    name={c}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    defaultValue={budget.categories?.[c] || ''}
                  />
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal('')}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Save budget
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'settings' && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setModal('')}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <small>DATA MANAGEMENT</small>
                <h2>Settings & backup</h2>
                <p>Your records reside strictly inside this browser.</p>
              </div>
              <button type="button" className="icon" onClick={() => setModal('')} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <div className="settings-actions">
              <button className="secondary" onClick={backup}>
                <Download size={16} /> Download JSON backup
              </button>

              <label className="secondary file-label">
                <Upload size={16} /> Import JSON backup
                <input type="file" accept="application/json" onChange={restore} />
              </label>

              <button
                className="secondary danger"
                onClick={() => {
                  if (confirm('Delete all data in this browser? This cannot be undone.')) {
                    save({ version: 1, transactions: [], budgets: {} })
                    setModal('')
                    say('Local data cleared.')
                  }
                }}
              >
                <Trash2 size={16} /> Clear all data
              </button>
            </div>

            <div className="privacy-note" style={{ marginTop: 20 }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>
                No cloud servers or accounts required. Export regular backups to prevent data loss if browser cache is cleared.
              </span>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} style={{ color: '#10b981' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default App
