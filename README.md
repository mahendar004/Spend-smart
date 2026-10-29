# SpendSmart

SpendSmart is a personal finance tracker for recording everyday income, expenses and monthly spending plans. It runs in your browser and does not connect to a bank or require an account.

## What you can do

- Review monthly income, expenses, balance and savings rate.
- See six months of cash flow and a category spending chart.
- Add, edit and delete income or expense transactions.
- Search and filter transaction history by type and category.
- Create monthly and category budgets and see approaching or exceeded limits.
- Review reports, export transactions to CSV, and back up or restore data as JSON.
- Use the responsive interface on desktop or mobile.

## Technology

React 19, Vite, JavaScript, Recharts and Lucide icons. Data is saved in browser `localStorage`; there is no backend or cloud sync.

## Requirements

Install Node.js 20.19+ (or 22.12+) and npm. Node 24 is supported. No API keys are needed.

## Start the app

Open a terminal in this project folder and run:

```bash
npm install
npm run dev
```

Open the local address Vite prints, usually `http://localhost:5173`.

## Build and tests

```bash
npm run build
npm test
```

`npm run preview` serves the production build locally. To deploy, build the project and publish the generated `dist/` folder on a static host such as Netlify, Vercel or GitHub Pages. No server environment variables are needed.

## Project layout

```text
src/
  App.jsx          Screens, shared layout, forms and user interactions
  App.css          Dashboard and component styles
  overrides.css    Dialog and responsive styles
  finance.js       Currency, category, calculation and storage helpers
  finance.test.js  Tests for financial calculations and browser storage
  index.css        Global styles and accessibility focus states
  main.jsx         React entry point
```

## Data and privacy

The app uses the versioned `spendsmart.data.v1` localStorage key in the current browser profile. Data stays on that browser and device. This app does not encrypt or sync it. Clearing site data may remove your records. Use Settings to export a JSON backup, and keep it somewhere safe. Avoid entering bank credentials, card details or other secrets. CSV exports include your transaction details; handle them with the same care.

The JSON import checks required transaction fields before replacing saved records. Invalid files leave the current data unchanged.

## Manual check list

- [ ] Add one income and one expense; check the monthly totals.
- [ ] Edit a transaction and remove another after confirming.
- [ ] Change the month and check that dashboard totals follow it.
- [ ] Search transactions and combine type and category filters.
- [ ] Set a total and category budget; check normal, near-limit and exceeded states.
- [ ] Refresh and check that the records remain.
- [ ] Export CSV and JSON, then import a JSON backup.
- [ ] Resize to a phone width and check navigation and forms.

## Troubleshooting

- If install fails, check your Node version and connection, then retry `npm install`.
- If the page is blank, inspect the terminal running Vite for a build error.
- To clear local records, open Settings and choose **Clear all data**. This cannot be undone, so export a backup first if you need one.
