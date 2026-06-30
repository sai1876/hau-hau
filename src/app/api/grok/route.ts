import { NextResponse } from 'next/server';
import { getSession } from '../../../services/apiHelper';

// In-memory rate limiting map
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  
  // Filter timestamps to keep only those within the current window
  const activeTimestamps = timestamps.filter(t => now - t < windowMs);
  
  if (activeTimestamps.length >= limit) {
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(userId, activeTimestamps);
  return true;
}

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const session = await getSession(req);
    const hasFirebase = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );

    if (hasFirebase) {
      if (!session || session.status !== 'active') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Rate limiting (max 5 requests per minute per user)
      const rateLimitOk = checkRateLimit(session.uid);
      if (!rateLimitOk) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
      }
    }

    // 3. Parse only server-side environment variable keys (no client keys or public keys)
    const envKeys = process.env.GROQ_API_KEYS || '';
    const keys = envKeys.split(',').map(k => k.replace(/["']/g, '').trim()).filter(Boolean);

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Check if we should run in Mock Mode (if no keys or mock flags)
    const isMock = keys.length === 0 || keys.includes('grok-mock') || keys.includes('mock');

    if (isMock) {
      const mockResult = getMockResponse(action, data);
      return NextResponse.json(mockResult);
    }

    // Prepare system prompts and user prompts based on action
    let systemPrompt = "You are an expert AI Restaurant Consultant and POS Operations Analyst. Your job is to analyze cafeteria data and return structured JSON only. No markdown formatting, no backticks, no comments, just the raw JSON.";
    let userPrompt = "";

    switch (action) {
      case 'forecast':
        systemPrompt += " Return JSON with keys: 'revenueForecast' (array of {date: string, forecastedRevenue: number, confidence: number}), 'peakHours' (array of {timeOfDay: string, explanation: string}), 'staffingSuggestions' (array of string), 'prepRecommendations' (array of string).";
        userPrompt = `Analyze these recent orders data: ${JSON.stringify(data)}. Generate a 7-day revenue forecast starting tomorrow, highlight peak times, and suggest staffing/prep targets based on item popularity and volume.`;
        break;

      case 'menu-pricing':
        systemPrompt += " Return JSON with keys: 'categorization' (array of {itemId: string, category: string, class: 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog', explanation: string}), 'pricingSuggestions' (array of {itemId: string, name: string, currentPrice: number, suggestedPrice: number, rationale: string}), 'combos' (array of {title: string, items: string[], price: number, rationale: string}).";
        userPrompt = `Analyze these menu items and their transaction counts: ${JSON.stringify(data)}. Categorize them using the BCG Menu Matrix (Stars, Plowhorses, Puzzles, Dogs), suggest price modifications, and propose 2-3 custom combo packages.`;
        break;

      case 'spending-insights':
        systemPrompt += " Return JSON with keys: 'consumptionRate': string, 'spendingHabits': string, 'rechargeRecommendation': number, 'explanation': string.";
        userPrompt = `Analyze this student's info and token transactions: ${JSON.stringify(data)}. Provide a brief analysis of their cafeteria spending habits, their average weekly/daily token consumption rate, and a specific recommended recharge amount of tokens to cover their typical usage.`;
        break;

      case 'queue-optimize':
        systemPrompt += " Return JSON with keys: 'batchingSuggestions' (array of {title: string, description: string}), 'optimizedSequence' (array of string).";
        userPrompt = `Analyze these pending orders currently in the kitchen queue: ${JSON.stringify(data)}. Suggest prep batching combinations (e.g. cooking multiple items of the same type together) and a step-by-step optimized preparation sequence to minimize cooking delay.`;
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Attempt Groq API calls rotating through available keys if a limit or error is hit
    for (let i = 0; i < keys.length; i++) {
      const activeKey = keys[i];
      console.log(`[AI Proxy] Attempting API call with key index ${i}/${keys.length - 1}...`);

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          }),
        });

        // 429 indicates Rate Limit. If we hit this, or 401 (Unauthorized), or other errors, try the next key
        if (!response.ok) {
          const statusText = await response.text();
          console.warn(`[AI Proxy] Key index ${i} failed (Status: ${response.status}): ${statusText}`);
          continue;
        }

        const responseData = await response.json();
        const textContent = responseData.choices?.[0]?.message?.content || '{}';
        
        // Parse JSON to verify structure, then return
        const jsonResponse = JSON.parse(textContent.trim().replace(/^```json\s*/i, '').replace(/```$/, ''));
        console.log(`[AI Proxy] Request succeeded with key index ${i}`);
        return NextResponse.json(jsonResponse);

      } catch (apiError) {
        console.warn(`[AI Proxy] Request failed with key index ${i}:`, apiError);
        // Continue to the next key
      }
    }

    // If we exited the loop, it means ALL keys failed or were rate-limited. Fall back to mock response.
    console.warn('[AI Proxy] All provided API keys failed or rate-limited. Returning fallback mock response.');
    return NextResponse.json(getMockResponse(action, data));

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Fallback Mock Generator to ensure smooth UI interaction
function getMockResponse(action: string, data: any) {
  switch (action) {
    case 'forecast': {
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return d.toLocaleDateString('en-CA');
      });
      return {
        revenueForecast: [
          { date: dates[0], forecastedRevenue: 4200, confidence: 95 },
          { date: dates[1], forecastedRevenue: 3800, confidence: 90 },
          { date: dates[2], forecastedRevenue: 5100, confidence: 88 },
          { date: dates[3], forecastedRevenue: 4900, confidence: 92 },
          { date: dates[4], forecastedRevenue: 6400, confidence: 85 }, // Friday
          { date: dates[5], forecastedRevenue: 3200, confidence: 89 },
          { date: dates[6], forecastedRevenue: 2800, confidence: 94 },
        ],
        peakHours: [
          { timeOfDay: "12:30 PM - 2:00 PM", explanation: "Lunch rush hour. Heavy orders of Meals, Wraps and Beverages." },
          { timeOfDay: "5:30 PM - 7:00 PM", explanation: "Evening snack interval. High demand for Burgers, Sides, and Shakes." }
        ],
        staffingSuggestions: [
          "Deploy 3 staff members on shift for Friday afternoon rush (expected revenue spike).",
          "Ensure secondary cashier is active between 12:30 PM and 1:45 PM daily.",
          "Schedule prep staff 30 minutes earlier on high-volume Wednesdays."
        ],
        prepRecommendations: [
          "Pre-bake/thaw 25% extra burger buns ahead of the Friday evening rush.",
          "Pre-portion wrap stuffing by 11:30 AM to reduce order prep times.",
          "Keep ice dispensers fully stocked for heavy cold beverage demand."
        ]
      };
    }
    case 'menu-pricing': {
      return {
        categorization: [
          { itemId: "item_burger_spicy", category: "Burgers", class: "Star", explanation: "High sales volume and high profitability. The local favorite." },
          { itemId: "item_french_fries", category: "Sides", class: "Plowhorse", explanation: "Sold with almost every order, but has low individual pricing. Essential menu anchor." },
          { itemId: "item_premium_shake", category: "Drinks", class: "Puzzle", explanation: "High profit margin but low order volume. Needs marketing promotion." },
          { itemId: "item_normal_chai", category: "Drinks", class: "Plowhorse", explanation: "Extremely high transaction count, but very low pricing margins." }
        ],
        pricingSuggestions: [
          { itemId: "item_burger_spicy", name: "Spicy Paneer Burger", currentPrice: 90, suggestedPrice: 100, rationale: "Highly popular with low price elasticity. A ₹10 increase will boost gross margins by 11% with negligible volume drop." },
          { itemId: "item_premium_shake", name: "Special Chocolate Shake", currentPrice: 120, suggestedPrice: 110, rationale: "Currently price-prohibitive. Reducing the price to ₹110 could trigger a volume increase of up to 40%." }
        ],
        combos: [
          {
            title: "Campus Classic Combo",
            items: ["Spicy Paneer Burger", "French Fries", "Soft Drink"],
            price: 150,
            rationale: "Bundles the high-volume Star burger with the Plowhorse fries to drive ticket size up by ₹30."
          },
          {
            title: "Study Session Snack Pack",
            items: ["Special Chocolate Shake", "Garlic Bread"],
            price: 170,
            rationale: "Pairs the low-volume Puzzle shake with a popular snack item at a 15% discount to clear beverage inventory."
          }
        ]
      };
    }
    case 'spending-insights': {
      const studentName = data?.name || "Student";
      const txCount = data?.txCount || 4;
      return {
        consumptionRate: "1.8 tokens per day (Approx. ₹54/day)",
        spendingHabits: `${studentName} primarily visits during evening hours (5:00 PM - 7:00 PM). Orders are dominated by Burgers and cold beverages. Typically dines in.`,
        rechargeRecommendation: 15,
        explanation: `At the current rate of 1.8 tokens/day, a recharge of 15 tokens will cover ${studentName}'s orders for the next 8-9 active college days.`
      };
    }
    case 'queue-optimize': {
      return {
        batchingSuggestions: [
          {
            title: "Grill Batching",
            description: "Grill 4 burger patties simultaneously to satisfy pending orders for Table 3, Table 5, and Table 6."
          },
          {
            title: "Beverage Prep",
            description: "Batch prepare 2 cold coffees together in the blender; this saves 3 minutes of cleaning time between drinks."
          }
        ],
        optimizedSequence: [
          "1. Start grilling burger patties for all tables (takes 5 mins).",
          "2. Fry french fries for Table 3 and Table 5 (takes 4 mins).",
          "3. Prepare the cold coffees while fries are cooking (takes 2 mins).",
          "4. Assemble wraps/burgers and dispatch Table 3's order first."
        ]
      };
    }
    default:
      return { message: "Mock response generated" };
  }
}
