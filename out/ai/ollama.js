import { marked } from 'marked';
export async function* streamAI(messages, model, token) {
    try {
        const res = await fetch('https://ollama.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true
            })
        });
        if (!res.ok) {
            yield `Error: ${res.status} ${res.statusText}`;
            return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
            yield 'Error: Failed to get reader from response body';
            return;
        }
        const decoder = new TextDecoder();
        let fullContent = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        fullContent += json.message.content;
                        yield fullContent;
                    }
                }
                catch (e) {
                    console.error('Error parsing JSON line:', line, e);
                }
            }
        }
    }
    catch (err) {
        console.error('streamAI fetch error:', err);
        yield 'Failed to fetch AI response';
    }
}
export async function callAI(messages, model, token) {
    try {
        const res = await fetch('https://ollama.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false
            })
        });
        if (!res.ok) {
            return `Error: ${res.status} ${res.statusText}`;
        }
        const data = await res.json();
        const markdownReply = data.message?.content ?? 'No reply from AI';
        return marked.parse(markdownReply);
    }
    catch (err) {
        console.error('callAI fetch error:', err);
        return 'Failed to fetch AI response';
    }
}
