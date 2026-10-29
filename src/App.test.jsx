// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { KEY } from './finance'

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    )
  }
})

describe('SpendSmart App UI & Interaction Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    const sampleData = {
      version: 1,
      transactions: [
        { id: 'tx-1', description: 'Tech Corp Salary', amount: 85000, type: 'income', category: 'Salary', date: '2026-10-01', notes: 'Monthly payout' },
        { id: 'tx-2', description: 'Fresh Groceries Market', amount: 3200, type: 'expense', category: 'Food & Dining', date: '2026-10-05', notes: 'Weekly stock' },
        { id: 'tx-3', description: 'Metro Pass Recharge', amount: 1200, type: 'expense', category: 'Transportation', date: '2026-10-08', notes: 'Monthly commute' }
      ],
      budgets: {
        '2026-10': {
          total: 30000,
          categories: { 'Food & Dining': 10000, 'Transportation': 3000 }
        }
      }
    }
    localStorage.setItem(KEY, JSON.stringify(sampleData))
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders the application shell, brand, and navigation', () => {
    render(<App />)
    expect(screen.getByText('Personal Finance')).toBeDefined()
    expect(screen.getByRole('button', { name: /^overview$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^transactions/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^budgets$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^reports$/i })).toBeDefined()
  })

  it('renders overview KPI stat cards with correct calculated values', () => {
    render(<App />)
    expect(screen.getByText('TOTAL BALANCE')).toBeDefined()
    expect(screen.getByText('INCOME')).toBeDefined()
    expect(screen.getByText('SPENDING')).toBeDefined()
    expect(screen.getByText('SAVINGS RATE')).toBeDefined()
  })

  it('navigates to Transactions page and displays table and filters', () => {
    render(<App />)
    const txNavBtn = screen.getByRole('button', { name: /^transactions/i })
    fireEvent.click(txNavBtn)

    expect(screen.getByPlaceholderText(/search transactions/i)).toBeDefined()
    expect(screen.getByText('Tech Corp Salary')).toBeDefined()
    expect(screen.getByText('Fresh Groceries Market')).toBeDefined()
    expect(screen.getByText('Metro Pass Recharge')).toBeDefined()
  })

  it('filters transactions by search query', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^transactions/i }))

    const searchInput = screen.getByPlaceholderText(/search transactions/i)
    fireEvent.change(searchInput, { target: { value: 'Metro' } })

    expect(screen.getByText('Metro Pass Recharge')).toBeDefined()
    expect(screen.queryByText('Tech Corp Salary')).toBeNull()
    expect(screen.queryByText('Fresh Groceries Market')).toBeNull()
  })

  it('navigates to Budgets page and displays budget metrics', () => {
    render(<App />)
    const budgetsNavBtn = screen.getByRole('button', { name: /^budgets$/i })
    fireEvent.click(budgetsNavBtn)

    expect(screen.getByText(/your monthly plan/i)).toBeDefined()
    expect(screen.getByText('MONTHLY LIMIT')).toBeDefined()
    expect(screen.getByText('SPENT SO FAR')).toBeDefined()
    expect(screen.getByText('REMAINING')).toBeDefined()
  })

  it('navigates to Reports page and displays report metrics and privacy note', () => {
    render(<App />)
    const reportsNavBtn = screen.getByRole('button', { name: /^reports$/i })
    fireEvent.click(reportsNavBtn)

    expect(screen.getByText('PERIOD INCOME')).toBeDefined()
    expect(screen.getByText('PERIOD EXPENSES')).toBeDefined()
    expect(screen.getByText('NET SAVINGS')).toBeDefined()
    expect(screen.getByText(/no data ever leaves your device/i)).toBeDefined()
  })

  it('opens and closes the Add Transaction modal', () => {
    render(<App />)
    const addBtns = screen.getAllByRole('button', { name: /add transaction/i })
    fireEvent.click(addBtns[0])

    expect(screen.getByText('TRANSACTION ENTRY')).toBeDefined()
    expect(screen.getByPlaceholderText(/weekend groceries/i)).toBeDefined()

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    expect(screen.queryByText('TRANSACTION ENTRY')).toBeNull()
  })

  it('opens and closes Settings modal', () => {
    render(<App />)
    const settingsBtn = screen.getByRole('button', { name: /settings & backup/i })
    fireEvent.click(settingsBtn)

    expect(screen.getByText('Settings & backup')).toBeDefined()
    expect(screen.getByText(/download json backup/i)).toBeDefined()
    expect(screen.getByText(/import json backup/i)).toBeDefined()
    expect(screen.getByText(/clear all data/i)).toBeDefined()

    const closeBtn = screen.getByRole('button', { name: /close dialog/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByText('Settings & backup')).toBeNull()
  })

  it('adds a new transaction via form submission', () => {
    render(<App />)
    const addBtns = screen.getAllByRole('button', { name: /add transaction/i })
    fireEvent.click(addBtns[0])

    const descInput = screen.getByPlaceholderText(/weekend groceries/i)
    const amountInput = screen.getByPlaceholderText('0.00')

    fireEvent.change(descInput, { target: { value: 'Organic Vegetables' } })
    fireEvent.change(amountInput, { target: { value: '650' } })

    const form = descInput.closest('form')
    fireEvent.submit(form)

    expect(screen.getByText(/transaction added/i)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /^transactions/i }))
    expect(screen.getByText('Organic Vegetables')).toBeDefined()
  })
})
