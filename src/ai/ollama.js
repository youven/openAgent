export async function callAI(text, model) {
  const token = 'b31ea0f5f30241b4803f963cf247a39d.JDhL81ABh5EbrsQBJkWWHX5R';

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <-- required for cloud
      },
      body: JSON.stringify({
        model,                  // e.g., 'gemma3', 'llama3'
        messages: [{ role: 'user', content: text }],
        stream: false
      })
    });

    if (!response.ok) {
      return `Error: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    // cloud chat responses can be in `data.response` or in first choice
    return data.response ?? data.choices?.[0]?.message?.content ?? 'No reply from AI';
  } catch (err) {
    console.error('callAI fetch error:', err);
    return 'Failed to fetch AI response';
  }
}
