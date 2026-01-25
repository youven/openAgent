import * as vscode from 'vscode';
import { callAI, streamAI } from './ai/ollama.js';

let panel: vscode.WebviewPanel | undefined;
export function activate(context: vscode.ExtensionContext) {
  console.log('OpenAgent: activate()');
  // Register the command that opens the standalone webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand('auto.openAgent', async () => {
      // 1️⃣ Get the token
      const token = await getToken(context);
      if (!token) {
        vscode.window.showErrorMessage('Ollama token is required to use OpenAgent.');
        return; // stop if user canceled
      }

      if (panel) {
        panel.reveal(vscode.ViewColumn.One);
        return;
      }

      // 2️⃣ Open the Webview panel
      panel = vscode.window.createWebviewPanel(
        'openAgent',
        'Open AI Agent',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewHtml();

      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === 'send') {
          try {
            for await (const chunk of streamAI(msg.messages, msg.model, token)) {
              panel?.webview.postMessage({ command: 'chunk', text: chunk });
            }
          } catch (e) {
            panel?.webview.postMessage({ command: 'error', text: '⚠️ Failed to get response from AI.' });
          }
        }
      });
    })
  );

  // Diagnostic command: attempt to programmatically reveal the contributed view
  context.subscriptions.push(
    vscode.commands.registerCommand('auto.revealMainView', async () => {
      console.log('OpenAgent: revealMainView command running');
      try {
        // Try common view container command
        await vscode.commands.executeCommand('workbench.view.extension.openagent');
        console.log('OpenAgent: executed workbench.view.extension.openagent');
      } catch (e) {
        console.error('OpenAgent: failed to execute workbench.view.extension.openagent', e);
      }

      // Try opening view by id using different formats
      for (const id of ['openagent/mainView', 'openagent.mainView', 'mainView']) {
        try {
          // Some VS Code versions support 'workbench.views.openView'
          // we try executing it; if unsupported it will throw.
          // Fallback to just logging the attempt.
          await vscode.commands.executeCommand('workbench.views.openView', id);
          console.log('OpenAgent: workbench.views.openView succeeded for', id);
        } catch (err) {
          console.log('OpenAgent: workbench.views.openView not available/succeeded for', id, err === null || err === void 0 ? void 0 : err.toString());
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('auto.clearToken', async () => {
      await context.secrets.delete('ollamaToken');
      vscode.window.showInformationMessage('Ollama token cleared.');
    })
  );

  // Register a WebviewViewProvider for the activity bar view (mainView)
  console.log('OpenAgent: registering WebviewViewProvider for mainView');
  const provider = new OpenAgentViewProvider(context);
  // Register under multiple id formats to cover different resolution patterns
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('mainView', provider)
  );
}

class OpenAgentViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  constructor(private readonly context: vscode.ExtensionContext) { }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    console.log('OpenAgent: resolveWebviewView() called');
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getWebviewHtml();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === 'send') {
        try {
          const token = await getToken(this.context);
          if (!token) {
            webviewView.webview.postMessage({ command: 'token-missing' });
            return;
          }
          for await (const chunk of streamAI(msg.messages, msg.model, token)) {
            webviewView.webview.postMessage({ command: 'chunk', text: chunk });
          }
        } catch (e) {
          webviewView.webview.postMessage({ command: 'error', text: '⚠️ Failed to get response from AI.' });
        }
      } else if (msg.command === 'request-token') {
        await getToken(this.context);
      }
    });
  }
}
function getWebviewHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="
        default-src 'none';
        img-src https: data:;
        style-src 'unsafe-inline' https://cdnjs.cloudflare.com;
        script-src 'unsafe-inline' https://cdnjs.cloudflare.com;
      ">
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
  .user { background-color: #007acc; color: #fff; align-self: flex-end; }
  .agent { background-color: #2d2d2d; color: #eee; align-self: flex-start; border: 1px solid #444; }
  .typing { font-style: italic; color: #aaa; margin: 4px 0; font-size: 12px; }
  
  .input-wrapper {
    background-color: #252526;
    border: 1px solid #444;
    border-radius: 12px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s;
  }
  .input-wrapper:focus-within {
    border-color: #007acc;
  }
  #input {
    background: transparent;
    border: none;
    color: #fff;
    resize: none;
    outline: none;
    font-family: inherit;
    font-size: 14px;
    padding: 8px;
    min-height: 40px;
    max-height: 200px;
  }
  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding: 0 4px;
  }
  .footer-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  #model {
    background-color: #333;
    color: #ccc;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    outline: none;
  }
  .chip {
    background-color: #333;
    color: #aaa;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
  }
  #send-btn {
    background: transparent;
    border: none;
    color: #007acc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: transform 0.1s, color 0.2s;
  }
  #send-btn:hover { color: #0098ff; transform: scale(1.1); }
  #send-btn svg { width: 20px; height: 20px; fill: currentColor; }

  pre { padding: 10px; border-radius: 8px; overflow-x: auto; position: relative; background-color: #1a1a1a !important; }
  .copy-btn { position: absolute; top: 5px; right: 5px; padding: 4px 8px; border-radius: 4px; border: 1px solid #555; background-color: #333; color: #ccc; cursor: pointer; font-size: 10px; opacity: 0; transition: 0.2s; }
  pre:hover .copy-btn { opacity: 1; }
  .copy-btn:hover { background-color: #444; color: #fff; }
  
  .top-controls { display: flex; justify-content: flex-end; margin-bottom: 8px; }
  #clear-btn { background: transparent; border: 1px solid #444; color: #888; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; }
  #clear-btn:hover { background: #333; color: #ccc; }

  .token-guide {
    background-color: #2d2d2d;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .token-guide h3 { margin-top: 0; color: #007acc; font-size: 15px; }
  .token-guide ol { padding-left: 20px; margin: 10px 0; }
  .token-guide code { background: #1a1a1a; padding: 2px 4px; border-radius: 4px; }
  .token-guide .btn-link { color: #007acc; cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; font: inherit; }

  /* Slash Commands Menu */
  .slash-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background-color: #252526;
    border: 1px solid #444;
    border-radius: 8px;
    margin-bottom: 8px;
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 100;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.5);
  }
  .slash-item {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .slash-item:hover, .slash-item.active {
    background-color: #2a2d2e;
  }
  .slash-command {
    color: #fff;
    font-weight: bold;
    font-size: 13px;
    min-width: 70px;
  }
  .slash-desc {
    color: #888;
    font-size: 12px;
  }
  .slash-arrow {
    color: #555;
    font-size: 12px;
  }

</style>
</head>
<body>
<div class="container">
  <div class="top-controls">
    <button id="clear-btn">Clear Chat</button>
  </div>
  
  <div id="chat"></div>

  <div style="position: relative;">
    <div id="slash-menu" class="slash-menu">
      <div class="slash-item" data-cmd="/explain">
        <span class="slash-command">/explain</span>
        <span class="slash-arrow">⇢</span>
        <span class="slash-desc">Explain the selected code</span>
      </div>
      <div class="slash-item" data-cmd="/comment">
        <span class="slash-command">/comment</span>
        <span class="slash-arrow">⇢</span>
        <span class="slash-desc">Add comments to the code</span>
      </div>
      <div class="slash-item" data-cmd="/fixbug">
        <span class="slash-command">/fixbug</span>
        <span class="slash-arrow">⇢</span>
        <span class="slash-desc">Fix bugs in the selected code</span>
      </div>
      <div class="slash-item" data-cmd="/tests">
        <span class="slash-command">/tests</span>
        <span class="slash-arrow">⇢</span>
        <span class="slash-desc">Generate unit tests</span>
      </div>
    </div>

    <div class="input-wrapper">
      <textarea id="input" rows="1" placeholder="Type / for commands..."></textarea>
      <div class="input-footer">
        <div class="footer-left">
          <select id="model">
            <option value="gpt-oss:120b-cloud">GPT‑OSS 120B</option>
            <option value="qwen3-coder:480b-cloud">Qwen3 Coder 480B</option>
            <option value="gemma3-cloud">Gemma 3</option>
          </select>
          <button class="chip" id="slash-chip">/</button>
          <button class="chip">@repo</button>
        </div>
        <button id="send-btn" title="Send Message">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/prism.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-kotlin.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-java.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/prism-js.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.6/marked.min.js"><\/script>
<script>
const vscode = acquireVsCodeApi();
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const slashMenu = document.getElementById('slash-menu');
const slashChip = document.getElementById('slash-chip');

let currentAgentMessage = null;
let messages = []; // Conversation history

function appendMessage(content, sender) {
  const msg = document.createElement('div');
  msg.className = 'message ' + sender;
  
  if (sender === 'user') {
    msg.innerText = content;
    messages.push({ role: 'user', content });
  } else {
    msg.innerHTML = marked.parse(content);
    addCopyButtons(msg);
  }

  chat.appendChild(msg);
  Prism.highlightAll();
  chat.scrollTop = chat.scrollHeight;
  return msg;
}

function addCopyButtons(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerText = 'Copy';
    btn.onclick = () => {
      const code = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(code);
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = 'Copy', 2000);
    };
    pre.appendChild(btn);
  });
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
  currentAgentMessage = null;

  vscode.postMessage({ command: 'send', messages, model });
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (slashMenu.style.display === 'flex') {
      const active = slashMenu.querySelector('.slash-item.active');
      if (active) {
        applySlashCommand(active.dataset.cmd);
        e.preventDefault();
        return;
      }
    }
    e.preventDefault();
    sendMessage();
  }
  
  if (e.key === 'ArrowUp' && slashMenu.style.display === 'flex') {
    e.preventDefault();
    moveSlashSelection(-1);
  }
  if (e.key === 'ArrowDown' && slashMenu.style.display === 'flex') {
    e.preventDefault();
    moveSlashSelection(1);
  }
  if (e.key === 'Escape') {
    slashMenu.style.display = 'none';
  }
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  
  if (input.value === '/') {
    showSlashMenu();
  } else if (!input.value.startsWith('/')) {
    slashMenu.style.display = 'none';
  }
});

slashChip.addEventListener('click', () => {
  input.value = '/';
  input.focus();
  showSlashMenu();
});

function showSlashMenu() {
  slashMenu.style.display = 'flex';
  const items = slashMenu.querySelectorAll('.slash-item');
  items.forEach(i => i.classList.remove('active'));
  items[0].classList.add('active');
}

function moveSlashSelection(dir) {
  const items = Array.from(slashMenu.querySelectorAll('.slash-item'));
  const activeIdx = items.findIndex(i => i.classList.contains('active'));
  items[activeIdx].classList.remove('active');
  let nextIdx = activeIdx + dir;
  if (nextIdx < 0) nextIdx = items.length - 1;
  if (nextIdx >= items.length) nextIdx = 0;
  items[nextIdx].classList.add('active');
}

function applySlashCommand(cmd) {
  input.value = cmd + ' ';
  slashMenu.style.display = 'none';
  input.focus();
}

slashMenu.querySelectorAll('.slash-item').forEach(item => {
  item.addEventListener('click', () => {
    applySlashCommand(item.dataset.cmd);
  });
});

clearBtn.addEventListener('click', () => {
  messages = [];
  chat.innerHTML = '';
  currentAgentMessage = null;
});

window.addEventListener('message', event => {
  const data = event.data;
  removeTyping();

  if (data.command === 'chunk') {
    if (!currentAgentMessage) {
      currentAgentMessage = document.createElement('div');
      currentAgentMessage.className = 'message agent';
      chat.appendChild(currentAgentMessage);
    }
    currentAgentMessage.innerHTML = marked.parse(data.text);
    addCopyButtons(currentAgentMessage);
    
    // Update or add assistant message in history
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = data.text;
    } else {
      messages.push({ role: 'assistant', content: data.text });
    }

    Prism.highlightAll();
    chat.scrollTop = chat.scrollHeight;
  } else if (data.command === 'token-missing') {
    removeTyping();
    const guide = document.createElement('div');
    guide.className = 'token-guide';
    guide.innerHTML = '<h3>⚠️ Ollama Token Required</h3>' +
      '<p>To use OpenAgent AI, you need to add your Ollama API token:</p>' +
      '<ol>' +
        '<li>Go to <a href="https://ollama.com" target="_blank">ollama.com</a> and sign in.</li>' +
        '<li>Go to <b>API / Tokens</b> and copy your token.</li>' +
        '<li>Click <button class="btn-link" id="add-token-link">here</button> to enter and save your token.</li>' +
      '</ol>' +
      '<p><i>Your token is stored securely in VS Code\\\'s SecretStorage.</i></p>';
    chat.appendChild(guide);
    guide.querySelector('#add-token-link').onclick = () => {
      vscode.postMessage({ command: 'request-token' });
    };
    chat.scrollTop = chat.scrollHeight;
  } else if (data.command === 'error') {
    appendMessage(data.text, 'agent');
  }
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
