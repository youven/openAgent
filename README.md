# OpenAgent AI - VS Code Extension

Bring powerful AI models directly into VS Code using Ollama.

## Features

- **Rich Chat Interface**: Modern chat UI with typing indicators and smooth animations.
- **Multiple AI Models**: Support for world-class models like DeepSeek, Mistral, Gemma, and more.
- **Slash Commands**: Quick access to common tasks:
  - `/explain` - Explain the selected code.
  - `/comment` - Add documentation comments.
  - `/fixbug` - Find and fix bugs.
  - `/tests` - Generate unit tests.
- **Code Experience**:
  - Full syntax highlighting (Prism.js).
  - One-click **Copy Code** button on all code blocks.
- **Smart Conversations**: Remembers session history for context-aware replies.
- **Secure Storage**: Your API token is stored securely using VS Code's SecretStorage.
- **Clear Chat**: Easily reset the conversation with a dedicated button.

## Installation

1. Open VS Code.
2. Go to Extensions (`Ctrl+Shift+X`).
3. Search for `OpenAgent AI`.
4. Click **Install**.

## Usage

1. Open Command Palette (`Ctrl+Shift+P`).
2. Run: `Open AI Agent`.
3. The OpenAgent panel will open in the sidebar (or as a separate panel if opened via `Open AI Agent`).

### Managing Token
- To reset or change your token, run: `Clear Ollama Token` from the Command Palette.
- To discover available models on your server, run: `List Available Models`.

## Adding Ollama API Token

1. Go to [Ollama](https://ollama.com).
2. Sign in → API / Tokens → Copy token.
3. Paste token when prompted inside VS Code.
   *(Stored securely with VS Code SecretStorage)*

## Available AI Models

Select your preferred model from the dropdown:

- **GPT‑OSS 120B** - Powerful general-purpose model.
- **DeepSeek V3.2** - State-of-the-art reasoning and coding.
- **Mistral Large 3** - Massive 675B parameters for complex tasks.
- **Gemma 3 (27B)** - Google's latest open powerhouse.
- **Qwen3 Coder 480B** - Specialized for top-tier programming.
- **Kimi K2 Thinking** - Advanced chain-of-thought analysis.
- **MiniMax M2.1** - Fast and reliable responses.
- **Devstral 2** - Optimized for high-end software development.

## Shortcuts

- `Enter`: Send message.
- `Shift + Enter`: New line.
- `/`: Open Slash Commands menu.
- `Up/Down` (in menu): Navigate commands.
- `Esc`: Close menu.
