import * as vscode from 'vscode';
import { callAI } from './ai/ollama.js';
let panel;
export function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('auto.openAgent', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
            return;
        }
        panel = vscode.window.createWebviewPanel('openAgent', 'Open AI Agent', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = getWebviewHtml();
        panel.onDidDispose(() => {
            panel = undefined;
        });
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'send') {
                const reply = await callAI(msg.text, msg.model);
                panel.webview.postMessage({ reply });
            }
        });
    }));
    function getWebviewHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Open AI Agent</title>
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
  .user {
    background-color: #0a84ff;
    color: #fff;
    align-self: flex-end;
  }
  .agent {
    background-color: #3c3c3c;
    color: #eee;
    align-self: flex-start;
  }
  .typing {
    font-style: italic;
    color: #aaa;
    margin: 4px 0;
  }
  #input-container {
    display: flex;
    gap: 8px;
  }
  #input {
    flex: 1;
    padding: 10px;
    border-radius: 20px;
    border: none;
    outline: none;
    background-color: #333;
    color: #fff;
  }
  #send-btn {
    padding: 0 20px;
    border-radius: 20px;
    border: none;
    background-color: #0a84ff;
    color: #fff;
    cursor: pointer;
    transition: 0.2s;
  }
  #send-btn:hover {
    background-color: #0066cc;
  }
</style>
</head>
<body>
<div class="container">
  <select id="model">
    <option value="gpt-oss:120b-cloud">GPT-OSS 120B</option>
    <option value="mistral">Mistral</option>
    <option value="gemma">Gemma</option>
  </select>

  <div id="chat"></div>

  <div id="input-container">
    <input id="input" placeholder="Type a message..." />
    <button id="send-btn">Send</button>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send-btn');

  function appendMessage(content, sender) {
    const msg = document.createElement('div');
    msg.className = 'message ' + sender;
    msg.innerHTML = content;
    chat.appendChild(msg);
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
</script>
</body>
</html>
`;
}

}
