// Crypto assets fetched via CoinGecko (no API key required)
export const CRYPTO_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', type: 'crypto' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', type: 'crypto' },
];

// Stock assets fetched via Alpha Vantage (requires a free API key)
export const STOCK_ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { symbol: 'RELIANCE.BSE', name: 'Reliance Industries', type: 'stock' },
  { symbol: 'TCS.BSE', name: 'Tata Consultancy Services', type: 'stock' },
];

// Timeline data for the History screen
export const HISTORICAL_EVENTS = [
  {
    year: 1929,
    title: 'The Great Crash',
    description:
      'The Wall Street Crash triggers the Great Depression, wiping out a huge share of market value within days.',
    change: -89,
    sentiment: 'negative',
  },
  {
    year: 1945,
    title: 'End of World War II',
    description:
      'Post-war reconstruction and industrial expansion fuel a long period of sustained economic growth.',
    change: 35,
    sentiment: 'positive',
  },
  {
    year: 1971,
    title: 'End of the Gold Standard',
    description:
      'The US abandons the gold standard, reshaping global currency markets and commodity pricing.',
    change: 10,
    sentiment: 'positive',
  },
  {
    year: 1987,
    title: 'Black Monday',
    description:
      'Global stock markets crash in a single day, with major indices losing over 20% of their value.',
    change: -22,
    sentiment: 'negative',
  },
  {
    year: 2000,
    title: 'Dot-com Bubble Burst',
    description:
      'Overvalued internet companies collapse, erasing trillions of dollars in tech market value.',
    change: -40,
    sentiment: 'negative',
  },
  {
    year: 2008,
    title: 'Global Financial Crisis',
    description:
      'The collapse of major financial institutions triggers a worldwide recession and market meltdown.',
    change: -50,
    sentiment: 'negative',
  },
  {
    year: 2020,
    title: 'COVID-19 Market Crash & V-Shaped Recovery',
    description:
      'Markets crash sharply as the pandemic spreads, then rebound on stimulus measures and vaccine optimism.',
    change: -34,
    sentiment: 'negative',
  },
  {
    year: 2021,
    title: 'GameStop Short Squeeze - Retail Investing Revolution',
    description:
      'Retail traders coordinate online to squeeze short sellers in GameStop, with the stock surging in days.',
    change: 1625,
    sentiment: 'positive',
  },
  {
    year: 2022,
    title: 'Russia-Ukraine Invasion',
    description:
      'The invasion triggers sanctions, commodity shocks across energy and food, and global market volatility.',
    change: -10,
    sentiment: 'negative',
  },
  {
    year: 2024,
    title: 'AI Boom - ChatGPT & OpenAI Surge',
    description:
      'Artificial intelligence becomes mainstream as adoption accelerates, with tech stocks rallying sharply.',
    change: 40,
    sentiment: 'positive',
  },
];
