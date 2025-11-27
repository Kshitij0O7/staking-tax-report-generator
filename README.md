# Staking Tax Calculator

A Next.js application for calculating staking tax reports from validator addresses.

## Features

- Upload CSV or Excel files with validator addresses
- Validate file format, duplicates, and empty rows
- Fetch transaction balance updates from Bitquery API
- Process and normalize data
- Group by validator, date, and event type
- Generate aggregates (daily/monthly/yearly totals)
- Display results in sortable, filterable tables
- Export to CSV, Excel, or JSON
- Tax-year views for different jurisdictions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Bitquery API key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with:

- `BITQUERY_API_KEY`: Your Bitquery API key (required)
- `BITQUERY_API_URL`: Bitquery API endpoint (optional, default: https://streaming.bitquery.io/graphql)

**Note:** 
- The API key is kept server-side for security. Never expose it in client-side code.
- The API fetches staking rewards (BalanceChangeReasonCode: 5) for the last 3 months by default.
- All validator addresses are processed in a single API call for efficiency.

