export async function callAI(prompt, model) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            stream: false
        })
    });
    const data = (await response.json());
    return data.response ?? 'No response';
}
