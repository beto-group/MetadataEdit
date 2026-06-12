# Contribution Guidelines - MetadataEdit

Welcome! This component is part of the BetoOS Datacore library. Please adhere to the following architectural standards.

## Codebase Architecture

The module utilizes a split-file structure to guarantee legibility, testability, and isolated execution scopes:

```text
MetadataEdit/
├── METADATA EDIT.md       # Obsidian entry point
├── METADATA.md            # Component manifest
├── README.md              # Documentation
├── CONTRIBUTION.md        # This file
├── LICENSE.md             # MIT license
├── data/
│   ├── example/           # Sample notes for testing
│   │   └── Greek Sheet Pan Chicken Dinner.md
│   ├── mcp_state.json     # Live editor status
│   └── mcp_commands.json  # External watch/reload trigger
├── assets/
│   ├── image/
│   │   └── preview.webp   # Static preview image
│   └── videos/
│       └── preview.gif    # Immersive preview clip
└── src/
    ├── index.jsx          # Event-driven code watch and reload daemon
    ├── App.jsx            # Main layout and coordinator
    ├── components/
    │   ├── FilePanel.jsx  # File selection controllers
    │   ├── EditorPanel.jsx # Property inspector tables
    │   ├── BulkOperations.jsx # Bulk add/edit/delete modals
    │   └── MCPBridge.jsx  # Model context synchronization
    └── utils/
        └── domUtils.js    # Workspace leaf node locators
```

## Developer Standards

1. **Strict No Emojis Policy**: Emojis are never allowed in the component user interface or any documentation files (including README.md, CONTRIBUTION.md, etc.). Use Lucide vector icons or clean plain text instead.
2. **Path safety**: Do not hardcode absolute path strings (such as /Volumes/ or /Users/). Use relative paths or folder path properties passed from the loader.
3. **No-Polling Code Watcher**: The index bootstrapper registers an event listener with `app.vault.on("modify")` targeting files under `MetadataEdit/src/`. This triggers an instant reload of the component's React view when source code modifications are saved, bypassing background CPU polling entirely.
4. **MCP Command System**: To force a code reload remotely via MCP agents, write the following payload to `data/mcp_commands.json`:
   ```json
   {"action":"reload","executed":false}
   ```
