<div align="center">
  <a name="readme-top"></a>
  <img src="https://raw.githubusercontent.com/beto-group/beto.assets/main/BETO.logo.animated.svg?raw=true" alt="LOGO" width="160">
  <h1 align="center">MetadataEdit</h1>
  <h3 align="center">Multi-File Frontmatter and YAML Property Editor</h3>
</div>

<div align="center">
  <!-- TOP PURPLE LINKS -->
  <a href="https://beto.group"><img src="https://img.shields.io/badge/WEBSITE-7A46F1?style=for-the-badge&logo=data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22white%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpath d%3D%22M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6%22%2F%3E%3Cpolyline points%3D%2215 3 21 3 21 9%22%2F%3E%3Cline x1%3D%2210%22 x2%3D%2221%22 y1%3D%2214%22 y2%3D%223%22%2F%3E%3C%2Fsvg%3E" alt="WEBSITE"></a>
  <a href="https://discord.com/invite/6rDp4q4Y2B"><img src="https://img.shields.io/badge/DISCORD-7A46F1?style=for-the-badge&logo=discord&logoColor=white" alt="JOIN OUR DISCORD"></a>
  <a href="https://github.com/sponsors/beto-group"><img src="https://img.shields.io/badge/Sponsor-7A46F1?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="SUPPORT US ON GITHUB"></a>
  <br/>
  <!-- BOTTOM GOLD TAXONOMY -->
  <img src="https://img.shields.io/badge/TARGET-DATACORE-000?style=for-the-badge&logo=data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%2523FFE165%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cellipse cx%3D%2212%22 cy%3D%225%22 rx%3D%229%22 ry%3D%223%22%2F%3E%3Cpath d%3D%22M3 5v14a9 3 0 0 0 18 0V5%22%2F%3E%3Cpath d%3D%22M3 12a9 3 0 0 0 18 0%22%2F%3E%3C%2Fsvg%3E" alt="TARGET">
  <img src="https://img.shields.io/badge/SECURITY-VAULT_FS-000?style=for-the-badge&logo=data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%2523FFE165%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpath d%3D%22M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z%22%2F%3E%3C%2Fsvg%3E" alt="SECURITY">
  <img src="https://img.shields.io/badge/RUNTIME-REACT-000?style=for-the-badge&logo=data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%2523FFE165%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline points%3D%224 17 10 11 4 5%22%2F%3E%3Cline x1%3D%2212%22 x2%3D%2220%22 y1%3D%2219%22 y2%3D%2219%22%2F%3E%3C%2Fsvg%3E" alt="RUNTIME">
  <hr>
</div>

<img src="assets/videos/preview.gif" alt="Metadata Edit Walkthrough" width="100%">

<p align="center"><i>A comprehensive multi-file frontmatter editor inside Obsidian workspace leaves, featuring type-aware UI inputs and bulk editing operations (Bulk Add, Bulk Edit, Bulk Delete).</i></p>

The Metadata Edit component provides an IDE-like workspace environment for managing markdown frontmatter properties. It allows developers to load multiple vault files, inspect their properties side-by-side using tabs, perform type-aware inline value edits (arrays, booleans, numbers, dates, times, strings), and execute bulk actions across all selected files.

## Features

- **Multi-File Load and Tabs**: Load multiple Markdown notes simultaneously and switch between their frontmatter views using a tabbed interface.
- **Type-Aware Editing Controls**: Automatically detects property value types to render specialized inputs (nested list managers, calendars, checkboxes, number scrollboards).
- **Code Hot-Reloading**: Incorporates an event-driven code watcher in `index.jsx` which detects modifications to source code files and instantly reloads the view without polling.
- **Bulk Attribute Operations**:
  - **Bulk Edit**: Select any key across active files and update its value universally.
  - **Bulk Add**: Append a new key-value property configuration across all loaded files.
  - **Bulk Delete**: Strip an unwanted metadata attribute from all files with one-click confirmation.
- **MCP Sync Bridge**: Continually synchronizes editor states with `data/mcp_state.json` and listens to forced reload signals in `data/mcp_commands.json`.

## Directory Index and Components

The package exposes the following compiled files:

| File | Description |
| :--- | :--- |
| **[MetadataEdit.md](MetadataEdit.md)** | Main entry point note designed to load in the Obsidian workspace leaf. |
| **[src/index.jsx](src/index.jsx)** | Main entry bootstrapper coordinating code modification auto-reloads. |
| **[src/App.jsx](src/App.jsx)** | Coordinator component managing local properties and FullTab layouts. |
| **[src/components/FilePanel.jsx](src/components/FilePanel.jsx)** | Left selection panel controlling note paths and validations. |
| **[src/components/EditorPanel.jsx](src/components/EditorPanel.jsx)** | Main grid table handling inline property fields and single value modifications. |
| **[src/components/BulkOperations.jsx](src/components/BulkOperations.jsx)** | Toolbar and modals executing bulk additions, edits, and deletions. |
| **[src/components/MCPBridge.jsx](src/components/MCPBridge.jsx)** | Synchronizer module writing status reports to `mcp_state.json`. |
| **[src/utils/domUtils.js](src/utils/domUtils.js)** | DOM helper utilities supporting portal sibling mounting. |
| **[data/example/](data/example/)** | Standard data folder containing the example recipe note (`Greek Sheet Pan Chicken Dinner.md`). |
| **[METADATA.md](METADATA.md)** | Packaging manifest outlining indexing, target, and security configurations. |
| **[CONTRIBUTION.md](CONTRIBUTION.md)** | Contributor architecture standards and local compilation guidelines. |
| **[LICENSE.md](LICENSE.md)** | MIT open-source license. |

## Contributors
- beto.group
