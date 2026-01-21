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
<html>
<body>
  <h3>Open AI Agent</h3>
  <select id="model">
    <option value="llama3">LLaMA 3</option>
    <option value="mistral">Mistral</option>
    <option value="gemma">Gemma</option>
  </select>
  <div id="chat" style="height:300px;overflow:auto;border:1px solid #ccc;padding:5px;"></div>
  <input id="input" placeholder="Type message" />
  <button onclick="send()">Send</button>
  <script>
    const vscode = acquireVsCodeApi();
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');

    function scrollChat() {
      chat.scrollTop = chat.scrollHeight;
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;

      const model = document.getElementById('model').value;
      vscode.postMessage({ command: 'send', text, model });

      chat.innerHTML += '<p><b>You:</b> ' + text + '</p>';
      scrollChat();
      input.value = '';
    }

    window.addEventListener('message', event => {
      chat.innerHTML += '<p><b>Agent:</b> ' + event.data.reply + '</p>';
      scrollChat();
    });
  </script>
</body>
</html>
`;
    }
}
