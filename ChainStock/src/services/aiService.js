// =========================================================================
// AI prediction service
// Uses the Anthropic API to generate BUY/SELL/HOLD signals based on
// live market data.
//
// Get an API key at: https://console.anthropic.com
//
// IMPORTANT: For a production app, never ship an Anthropic API key inside
// your mobile bundle. Anyone could extract it and run up your bill.
// Instead, call your own backend, and have your backend call Anthropic.
// The key below is provided for local development/testing only.
// =========================================================================

const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

/**
 * Ask Claude for a prediction signal for a given asset.
 * @param {{ symbol: string, name: string }} asset
 * @param {{ price: number, change24h: number, high24h?: number, low24h?: number, high?: number, low?: number }} marketData
 * @param {number} years - prediction horizon in years (1-10)
 * @returns {Promise<{ signal: string, confidence: number, support: number, resistance: number, summary: string, catalysts: string[] }>}
 */
export async function getPrediction(asset, marketData, years = 1) {
  const prompt = `You are a financial analysis assistant inside an app called ChainStock.

Asset: ${asset.name} (${asset.symbol})
Current price: ${marketData.price}
24h change: ${marketData.change24h}%
24h high: ${marketData.high24h ?? marketData.high ?? 'N/A'}
24h low: ${marketData.low24h ?? marketData.low ?? 'N/A'}

Provide an outlook for a ${years}-year prediction horizon.

Respond with ONLY valid JSON (no markdown code fences, no extra commentary) in exactly this shape:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": number between 0 and 100,
  "support": number (price level),
  "resistance": number (price level),
  "summary": string (2-3 sentence analysis),
  "catalysts": [string, string, string]
}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI prediction request failed: ${errorBody}`);
  }

  const data = await response.json();
  const text = (data.content || []).map((block) => block.text || '').join('');
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Could not parse the AI prediction response');
  }
}
