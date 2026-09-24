import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    console.log('GROQ_API_KEY present:', !!apiKey);

    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are Blazer, the official AI assistant for AgentBlazer — a student-led AI & tech community at St Joseph Engineering College, Mangaluru. You are helpful, friendly, and concise. You assist community members with questions about events, tech topics, AI, and general club activities. Keep responses brief (2-3 sentences max) and use a casual but professional tone. Format with markdown if needed.'
          },
          ...messages.slice(-10)
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error status:', response.status, errText);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process that request.';
    
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
}
