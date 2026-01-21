import { marked } from 'marked';
export async function callAI(text, model, token) {
    //const token = 'b31ea0f5f30241b4803f963cf247a39d.JDhL81ABh5EbrsQBJkWWHX5R';
    try {
        const res = await fetch('https://ollama.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: text }],
                stream: false
            })
        });
        if (!res.ok) {
            return `Error: ${res.status} ${res.statusText}`;
        }
        const data = await res.json();
        const markdownReply = data.message?.content ?? 'No reply from AI';
        // Convert Markdown to HTML
        const htmlReply = marked.parse(markdownReply);
        return htmlReply;
    }
    catch (err) {
        console.error('callAI fetch error:', err);
        return 'Failed to fetch AI response';
    }
}
