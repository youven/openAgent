import * as vscode from 'vscode';
import { callAI } from './ai/ollama.js';

let panel: vscode.WebviewPanel | undefined;
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('auto.openAgent', async () => {
      // 1️⃣ Get the token
      const token = await getToken(context);
      if (!token) {
        vscode.window.showErrorMessage('Ollama token is required to use OpenAgent.');
        return; // stop if user canceled
      }

      // 2️⃣ Open the Webview
      panel = vscode.window.createWebviewPanel(
        'openAgent',
        'Open AI Agent',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewHtml();

      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === 'send') {
          const reply = await callAI(msg.text, msg.model, token);
          if (panel) {
            panel.webview.postMessage({ reply });
          }
        }
      });
    })
  );
}

function getWebviewHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Open AI Agent</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #1e1e1e;
    color: #eee;
  }
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 10px;
  }
  #chat {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #444;
    border-radius: 8px;
    background-color: #252526;
    margin-bottom: 10px;
  }
  .message {
    padding: 8px 12px;
    margin: 4px 0;
    border-radius: 12px;
    max-width: 70%;
    word-wrap: break-word;
  }
  .user { background-color: #0a84ff; color: #fff; align-self: flex-end; }
  .agent { background-color: #3c3c3c; color: #eee; align-self: flex-start; }
  .typing { font-style: italic; color: #aaa; margin: 4px 0; }
  #input-container { display: flex; gap: 8px; margin-bottom: 8px; }
  #input { flex: 1; padding: 10px; border-radius: 20px; border: none; outline: none; background-color: #333; color: #fff; }
  #send-btn { padding: 0 20px; border-radius: 20px; border: none; background-color: #0a84ff; color: #fff; cursor: pointer; transition: 0.2s; }
  #send-btn:hover { background-color: #0066cc; }
  #model-container { display: flex; justify-content: flex-start; }
  #model { padding: 8px 12px; border-radius: 20px; border: none; background-color: #333; color: #fff; cursor: pointer; outline: none; }
  #model option { background-color: #333; color: #fff; }
  pre { padding: 10px; border-radius: 8px; overflow-x: auto; }
</style>
</head>
<body>
<div class="container">
  <div id="chat"></div>

  <div id="input-container">
    <input id="input" placeholder="Type a message..." />
    <button id="send-btn">Send</button>
  </div>

  <div id="model-container">
   <select id="model">
  <option value="gpt-oss:120b-cloud">GPT‑OSS 120B</option>
  <option value="qwen3-coder:480b-cloud">Qwen3 Coder 480B</option>
  <option value="gemma3-cloud">Gemma 3</option> <!-- if cloud version exists -->
</select>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/prism.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-kotlin.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-java.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-js.min.js"><\/script>
<script>
const vscode = acquireVsCodeApi();
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(content, sender) {
  const msg = document.createElement('div');
  msg.className = 'message ' + sender;

  // detect code blocks (\`\`\`lang ... \`\`\`)
  const codeRegex = /\`\`\`(\\w+)?\\n([\\s\\S]*?)\`\`\`/g;
  let html = content.replace(codeRegex, (match, lang, code) => {
    const language = lang || 'javascript';
    return '<pre><code class="language-' + language + '">' + code + '<\/code><\/pre>';
  });

  msg.innerHTML = html;
  chat.appendChild(msg);
  Prism.highlightAll(); // highlight any code in the message
  chat.scrollTop = chat.scrollHeight;
}

function appendTyping() {
  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.id = 'typing-indicator';
  typing.innerText = 'Agent is typing...';
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  const model = document.getElementById('model').value;

  appendMessage(text, 'user');
  input.value = '';
  appendTyping();

  vscode.postMessage({ command: 'send', text, model });
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

window.addEventListener('message', event => {
  removeTyping();
  const reply = event.data.reply || '';
  appendMessage(reply, 'agent');
});
<\/script>
</body>
</html>
`;
}

// This function handles getting/asking/storing the user's Ollama token
export async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  let token = await context.secrets.get('ollamaToken');

  if (!token) {
    // Ask user to input their token
    token = await vscode.window.showInputBox({
      prompt: 'Enter your Ollama API token',
      placeHolder: 'b31ea0f5f30241b4803f963cf247a39d.JDhL81ABh5EbrsQBJkWWHX5R',
      ignoreFocusOut: true,
      password: true // hides input
    });

    if (token) {
      // Store it securely
      await context.secrets.store('ollamaToken', token);
      vscode.window.showInformationMessage('Ollama token saved securely.');
    }
  }

  return token; // can be undefined if user canceled input
}
