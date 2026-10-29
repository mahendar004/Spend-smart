// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { KEY, budgetStatus, categoryTotals, filterTransactions, inMonth, load, persist, savingsRate, totals, validAmount } from './finance'

const entries = [
  { id: '1', date: '2024-02-01', description: 'Monthly salary', type: 'income', category: 'Salary', amount: 1000 },
  { id: '2', date: '2024-02-29', description: 'Food shop', type: 'expense', category: 'Food & Dining', amount: 250 },
  { id: '3', date: '2024-03-01', description: 'Food lunch', type: 'expense', category: 'Food & Dining', amount: 80 },
]

describe('finance calculations', () => {
  it('totals income and expense without mixing types', () => {
    expect(totals(entries)).toEqual({ income: 1000, expense: 330 })
  })

  it('uses inclusive first and last calendar dates for month filtering', () => {
    expect(inMonth(entries, '2024-02')).toEqual(entries.slice(0, 2))
    expect(inMonth(entries, '2024-03')).toEqual(entries.slice(2))
  })

  it('handles savings rate when income is zero', () => {
    expect(savingsRate(100, 25)).toBe(75)
    expect(savingsRate(0, 0)).toBeNull()
  })

  it('groups amounts by category', () => {
    expect(categoryTotals(entries)).toEqual({ 'Food & Dining': 330 })
    expect(categoryTotals(entries, 'income')).toEqual({ Salary: 1000 })
  })

  it('combines search, type, category and month filters, then sorts by amount', () => {
    expect(filterTransactions(entries, {
      query: 'food', type: 'expense', category: 'Food & Dining', month: '2024-02', sort: 'Highest amount',
    })).toEqual([entries[1]])
    expect(filterTransactions(entries, { type: 'income', month: '2024-02' })).toEqual([entries[0]])
  })

  it('reports budget thresholds without dividing by a zero limit', () => {
    expect(budgetStatus(79, 100)).toMatchObject({ remaining: 21, percent: 79, status: 'normal' })
    expect(budgetStatus(80, 100).status).toBe('near')
    expect(budgetStatus(110, 100).status).toBe('over')
    expect(budgetStatus(5, 0)).toMatchObject({ remaining: 0, percent: null, status: 'unset' })
  })

  it('rejects zero, negative, invalid and non-finite amounts', () => {
    expect([10, '0.01'].every(validAmount)).toBe(true)
    expect([0, -1, 'abc', Infinity, NaN].some(validAmount)).toBe(false)
  })
})

describe('browser storage', () => {
  beforeEach(() => localStorage.clear())

  it('loads empty state when no data exists', () => {
    expect(load()).toEqual({ version: 1, transactions: [], budgets: {} })
  })

  it('persists and reloads a valid versioned dataset', () => {
    const value = { version: 1, transactions: entries, budgets: { '2024-02': { total: 500 } } }
    expect(persist(value)).toBe(true)
    expect(localStorage.getItem(KEY)).toBeTruthy()
    expect(load()).toEqual(value)
  })

  it('does not replace malformed stored JSON while reading it', () => {
    localStorage.setItem(KEY, '{broken json')
    expect(load()).toEqual({ version: 1, transactions: [], budgets: {} })
    expect(localStorage.getItem(KEY)).toBe('{broken json')
  })
})
