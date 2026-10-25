# Changelog

All notable changes to the **OpenAgent AI** extension will be documented in this file.

## [1.0.16] - 2026-10-25

### Added
- Added editor context to chat prompts, using the current selection or open file.
- Added visible Apply and Copy controls to AI code blocks.
- Added a diff preview before applying AI-generated code to the current editor.

### Fixed
- Applying code with no selection now inserts it at the cursor instead of replacing the entire file.
- Apply and editor context work from both the sidebar and standalone chat panel.

## [1.0.14] - 2026-01-26

### Added
- **Slash Commands Support**: Integrated `/explain`, `/comment`, `/fixbug`, and `/tests` commands directly into the chat input.
- **Copy Code Button**: Added a dedicated copy button to all AI-generated code blocks for a faster workflow.
- **Improved UI**: Redesigned the input area with a modern model selector and paper plane send icon.
- **Expanded Model List**: Added support for more advanced models like DeepSeek V3.2, Mistral Large 3, Kimi K2, and Devstral 2.
- **Diagnostic Tools**: Added `List Available Models` command to help users troubleshoot model availability on their server.
- **Enhanced Token Setup**: Improved the "Missing Token" experience with an interactive setup guide inside the chat.

### Fixed
- Fixed 404 errors for several models by using verified server identifiers.
- Fixed 403 Forbidden errors by adding support for stable models like Gemini Flash.
- Optimized chat responsiveness and Enter-key handling.

## [1.0.0] - 2026-01-14

### Added
- Initial release with local Ollama support.
- Basic chat functionality and multi-model selector.
- Secure SecretStorage for API tokens.
