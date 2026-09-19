// /api/ai-suggestion.js
// Vercel serverless function. Runs server-side only — this is the ONLY place
// the Groq API key is used, so it is never exposed to the browser.
//
// Input body: { amount, splitPercentages, studentName }
// Output: { explanation }
//
// IMPORTANT: Groq is asked only to write a friendly 2-3 sentence explanation.
// The actual numbers come from the deterministic split engine on the client
// (frontend/src/utils/splitEngine.js) and are passed in already-calculated.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, splitPercentages, studentName } = req.body || {};

  if (!amount || !splitPercentages) {
    return res.status(400).json({ error: "Missing amount or splitPercentages" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Pre-computed fallback so the app never breaks, even with no key or a
  // failed request.
  const emergencyAmt = Math.round((amount * splitPercentages.emergencyPct) / 100);
  const savingAmt = Math.round((amount * splitPercentages.savingPct) / 100);
  const enjoymentAmt = amount - emergencyAmt - savingAmt;
  const fallback = `Hi ${studentName || "there"}! You received ₹${amount} — here's a smart split: ` +
    `₹${emergencyAmt} to Emergency, ₹${savingAmt} to Saving, ₹${enjoymentAmt} for Enjoyment, ` +
    `because building healthy money habits early really pays off.`;

  if (!apiKey) {
    return res.status(200).json({ explanation: fallback, source: "fallback" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: "You write a short, warm, 2-3 sentence explanation for a teenager about how their " +
              "pocket money was split into Emergency, Saving, and Enjoyment buckets. Never invent or change " +
              "the numbers you are given — just explain them in a friendly, encouraging way.",
          },
          {
            role: "user",
            content: `Amount received: ₹${amount}. Emergency: ₹${emergencyAmt}, Saving: ₹${savingAmt}, ` +
              `Enjoyment: ₹${enjoymentAmt}. Student's name: ${studentName || "there"}.`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

    const data = await response.json();
    const explanation = data?.choices?.[0]?.message?.content?.trim();

    if (!explanation) throw new Error("Empty response from Groq");

    return res.status(200).json({ explanation, source: "groq" });
  } catch (err) {
    // Graceful fallback — the UI never breaks even if Groq is down.
    return res.status(200).json({ explanation: fallback, source: "fallback", error: String(err.message || err) });
  }
}
