const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(dc.resolvePath("METADATA EDIT/src/utils/domUtils.js"));
const { FilePanel } = await dc.require(dc.resolvePath("METADATA EDIT/src/components/FilePanel.jsx"));
const { EditorPanel, inferTypeFromValue, convertValueToType, PROPERTY_TYPES_CONFIG } = await dc.require(dc.resolvePath("METADATA EDIT/src/components/EditorPanel.jsx"));
const { BulkOperations } = await dc.require(dc.resolvePath("METADATA EDIT/src/components/BulkOperations.jsx"));
const { MCPBridge } = await dc.require(dc.resolvePath("METADATA EDIT/src/components/MCPBridge.jsx"));

async function mutateProperty(obsidianApp, files, key, value, action = 'update') {
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (action === 'delete') delete frontmatter[key];
      else frontmatter[key] = value;
    });
  });
  await Promise.all(promises);
}

async function addItemToList(obsidianApp, file, key, itemToAdd) {
  await obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
    if (!Array.isArray(frontmatter[key])) frontmatter[key] = [];
    frontmatter[key].push(itemToAdd);
  });
}

async function removeItemFromList(obsidianApp, file, key, itemIndexToRemove) {
  await obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
    if (Array.isArray(frontmatter[key])) frontmatter[key].splice(itemIndexToRemove, 1);
  });
}

async function setListProperty(obsidianApp, files, key, items) {
  const list = Array.isArray(items) ? items.slice() : [];
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter[key] = list.slice();
    });
  });
  await Promise.all(promises);
}

async function appendListItems(obsidianApp, files, key, items) {
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!Array.isArray(frontmatter[key])) frontmatter[key] = [];
      const existingSet = new Set(frontmatter[key].map(v => String(v)));
      items.forEach(it => {
        const s = String(it);
        if (!existingSet.has(s)) {
          frontmatter[key].push(it);
          existingSet.add(s);
        }
      });
    });
  });
  await Promise.all(promises);
}

async function removeListItems(obsidianApp, files, key, items) {
  const toRemove = new Set(items.map(v => String(v)));
  const promises = files.map(file => {
    return obsidianApp.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!Array.isArray(frontmatter[key])) return;
      frontmatter[key] = frontmatter[key].filter(v => !toRemove.has(String(v)));
    });
  });
  await Promise.all(promises);
}

function detectKeyTypeFromFiles(obsidianApp, files, key, propertyTypes) {
  let sawList = false, sawBool = false, sawNumber = false, sawDatetime = false, sawDate = false, sawStr = false;
  for (const f of files) {
    const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
    if (!fm || typeof fm[key] === 'undefined') continue;
    const v = fm[key];
    if (Array.isArray(v)) { sawList = true; break; }
    if (typeof v === 'boolean') { sawBool = true; continue; }
    if (typeof v === 'number') { sawNumber = true; continue; }
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) { sawDatetime = true; continue; }
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { sawDate = true; continue; }
      sawStr = true;
    }
  }
  if (sawList) return 'list';
  if (sawBool && !sawNumber && !sawStr) return 'checkbox';
  if (sawNumber && !sawStr) return 'number';
  if (sawDatetime) return 'datetime';
  if (sawDate) return 'date';
  return propertyTypes[key]?.type || 'text';
}

function getUnionListForKey(obsidianApp, files, key) {
  const seen = new Set();
  const out = [];
  files.forEach(f => {
    const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
    const arr = fm && Array.isArray(fm[key]) ? fm[key] : [];
    arr.forEach(v => {
      const s = String(v);
      if (!seen.has(s)) { seen.add(s); out.push(v); }
    });
  });
  return out;
}

function App(props) {
  const { dc } = props;
  const { useState, useEffect, useMemo, useRef } = dc;

  let obsidianApp = dc.app || app;
  if (!obsidianApp?.vault) return <h2>Waiting for Obsidian API...</h2>;

  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `metadata-edit-wrapper-${instanceId}`;

  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  // Resolve component paths
  const componentDir = useMemo(() => {
    const currentPath = dc.resolvePath("METADATA EDIT/src/App.jsx");
    if (!currentPath) return "";
    return currentPath.substring(0, currentPath.indexOf("/src/App.jsx"));
  }, []);

  const exampleFilePath = useMemo(() => {
    if (!componentDir) return "";
    return `${componentDir}/data/example/Greek Sheet Pan Chicken Dinner.md`;
  }, [componentDir]);

  const [fileInputs, setFileInputs] = useState([]);
  useEffect(() => {
    if (exampleFilePath) {
      setFileInputs([{ id: Date.now(), path: exampleFilePath }]);
    }
  }, [exampleFilePath]);

  const [validFiles, setValidFiles] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState({});
  const [status, setStatus] = useState({ message: "Ready.", type: "info" });
  const [isLoading, setIsLoading] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [bulkMode, setBulkMode] = useState(null);
  const [bulkEditKey, setBulkEditKey] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [bulkEditList, setBulkEditList] = useState([]);
  const [bulkEditListMode, setBulkEditListMode] = useState('replace');
  const [bulkAddKey, setBulkAddKey] = useState("");
  const [bulkAddType, setBulkAddType] = useState("text");
  const [bulkAddValue, setBulkAddValue] = useState("");
  const [bulkAddList, setBulkAddList] = useState([]);
  const [bulkAddListMode, setBulkAddListMode] = useState('replace');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropType, setNewPropType] = useState('text');
  const [newPropValue, setNewPropValue] = useState('');
  const [newPropList, setNewPropList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto load example file if inputs empty
  useEffect(() => {
    if (componentDir && fileInputs.length === 1 && !fileInputs[0].path) {
      setFileInputs([{ id: Date.now(), path: exampleFilePath }]);
    }
  }, [componentDir, exampleFilePath]);

  // Sync valid files list
  useEffect(() => {
    const valid = fileInputs.map(input => {
      const file = obsidianApp.vault.getAbstractFileByPath(input.path.trim());
      return (file && file.extension) ? file : null;
    }).filter(Boolean);
    setValidFiles(valid);
    if (activeFileIndex >= valid.length) setActiveFileIndex(Math.max(0, valid.length - 1));
    if (valid.length === 0) setStatus({ message: "Add at least one valid file path to begin.", type: "info" });
    else setStatus({ message: `Loaded ${valid.length} file(s). Listening for changes.`, type: "info" });
    setPropertyTypes(obsidianApp.metadataTypeManager.properties);
  }, [fileInputs, refreshKey]);

  // Listen to external modifications
  useEffect(() => {
    if (validFiles.length === 0) return;
    const validPaths = new Set(validFiles.map(f => f.path));
    const handleMetadataChange = (file) => {
      if (validPaths.has(file.path)) {
        setStatus({ message: `Change detected in ${file.basename}. Refreshing...`, type: "info" });
        setRefreshKey(k => k + 1);
      }
    };
    obsidianApp.metadataCache.on('changed', handleMetadataChange);
    return () => { obsidianApp.metadataCache.off('changed', handleMetadataChange); };
  }, [validFiles]);

  const allUniqueKeys = useMemo(() => {
    const keys = new Set();
    validFiles.forEach(f => {
      const fm = obsidianApp.metadataCache.getFileCache(f)?.frontmatter;
      if (fm) Object.keys(fm).forEach(k => keys.add(k));
    });
    return Array.from(keys).sort();
  }, [validFiles, refreshKey]);

  const runOperation = async (operation, files, ...args) => {
    setIsLoading(true);
    try {
      await operation(obsidianApp, files, ...args);
      setStatus({ message: "Operation successful!", type: "success" });
    } catch (e) {
      setStatus({ message: `Error: ${e.message}`, type: "error" });
    } finally {
      setIsLoading(false);
      setBulkMode(null);
      setBulkEditValue('');
      setBulkAddKey('');
      setBulkAddValue('');
    }
  };

  const handleUpdateProperty = (file, key, value) => runOperation(mutateProperty, [file], key, value);
  const handleDeleteProperty = (file, key) => { if (window.confirm(`Delete '${key}' from ${file.basename}?`)) runOperation(mutateProperty, [file], key, null, 'delete'); };
  const handleAddItemToList = (file, key, item) => runOperation(addItemToList, [file], key, item);
  const handleRemoveItemFromList = (file, key, index) => runOperation(removeItemFromList, [file], key, index);

  const currentBulkType = bulkEditKey
    ? detectKeyTypeFromFiles(obsidianApp, validFiles, bulkEditKey, propertyTypes)
    : null;

  useEffect(() => {
    if (!bulkEditKey) { setBulkEditList([]); return; }
    const t = detectKeyTypeFromFiles(obsidianApp, validFiles, bulkEditKey, propertyTypes);
    if (t === 'list') setBulkEditList(getUnionListForKey(obsidianApp, validFiles, bulkEditKey));
    else setBulkEditList([]);
  }, [bulkEditKey, propertyTypes, validFiles]);

  const handleBulkUpdate = () => {
    if (!bulkEditKey) return;
    if (currentBulkType === 'list') {
      if (bulkEditListMode === 'replace') runOperation(setListProperty, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
      else if (bulkEditListMode === 'append') runOperation(appendListItems, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
      else if (bulkEditListMode === 'remove') runOperation(removeListItems, validFiles, bulkEditKey, convertValueToType(bulkEditList, 'list'));
    } else {
      runOperation(mutateProperty, validFiles, bulkEditKey, convertValueToType(bulkEditValue, currentBulkType || 'text'));
    }
  };

  const handleBulkAdd = () => {
    if (!bulkAddKey.trim()) return;
    if (bulkAddType === 'list') {
      if (bulkAddListMode === 'replace') runOperation(setListProperty, validFiles, bulkAddKey, convertValueToType(bulkAddList, 'list'));
      else runOperation(appendListItems, validFiles, bulkAddKey, convertValueToType(bulkAddList, 'list'));
    } else {
      runOperation(mutateProperty, validFiles, bulkAddKey, convertValueToType(bulkAddValue, bulkAddType));
    }
  };

  const handleBulkDelete = () => {
    if (!bulkEditKey) return;
    if (window.confirm(`Delete '${bulkEditKey}' from all ${validFiles.length} files?`)) {
      runOperation(mutateProperty, validFiles, bulkEditKey, null, 'delete');
    }
  };

  const handlePathChange = (id, newPath) => {
    setFileInputs(fileInputs.map(input => input.id === id ? { ...input, path: newPath } : input));
  };
  const addFileInput = () => { setFileInputs([...fileInputs, { id: Date.now(), path: '' }]); };
  const removeFileInput = (id) => { setFileInputs(fileInputs.filter(input => input.id !== id)); };

  const activeFile = validFiles[activeFileIndex];
  const activeFrontmatter = activeFile ? obsidianApp.metadataCache.getFileCache(activeFile)?.frontmatter : null;

  const handleAddSingleProperty = () => {
    if (!activeFile || !newPropKey.trim()) return;
    const value = newPropType === 'list' ? convertValueToType(newPropList, 'list') : convertValueToType(newPropValue, newPropType);
    runOperation(mutateProperty, [activeFile], newPropKey, value);
    setNewPropKey('');
    setNewPropValue('');
    setNewPropList([]);
  };

  // Full-tab reparenting
  useEffect(() => {
    if (!isFullTab) return;

    const container = containerRef.current;
    if (!container) return;

    const leaf = container.closest('.workspace-leaf-content');
    if (!leaf) return;

    const contentWrapper = leaf.querySelector(':scope > .view-content') || leaf;
    const currentParent = container.parentNode;
    if (!currentParent) return;

    stateRefs.originalParent = currentParent;
    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    if (container.nextSibling) {
      currentParent.insertBefore(placeholder, container.nextSibling);
    } else {
      currentParent.appendChild(placeholder);
    }
    stateRefs.placeholder = placeholder;

    const styleId = `metadataedit-status-${instanceId}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .status-bar, .view-footer, .workspace-leaf-content-footer { 
            display: none !important; 
        }
        .workspace-leaf-content { 
            padding: 0 !important; 
            margin: 0 !important; 
            border-radius: 0 !important; 
        }
      `;
      document.head.appendChild(styleEl);
    }

    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      originalInlinePosition: contentWrapper.style.position,
    };

    if (window.getComputedStyle(contentWrapper).position === 'static') {
      contentWrapper.style.position = "relative";
    }

    contentWrapper.appendChild(container);

    requestAnimationFrame(() => {
      Object.assign(contentWrapper.style, {
        padding: "0",
        margin: "0",
        height: "100%",
        width: "100%",
        display: "block",
        overflow: "hidden"
      });
    });

    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "hidden",
      backgroundColor: "#000000",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      } else if (stateRefs.originalParent) {
        stateRefs.originalParent.appendChild(container);
      }

      const el = document.getElementById(styleId);
      if (el) el.remove();

      if (stateRefs.parentPositionInfo?.element) {
        const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
        element.style.position = originalInlinePosition || '';
        element.style.padding = '';
        element.style.margin = '';
        element.style.height = '';
        element.style.width = '';
        element.style.overflow = '';
      }

      container.removeAttribute("style");
    };
  }, [isFullTab]);

  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  const handleCodeReload = () => {
    if (props.onCodeReloadRequest) {
      props.onCodeReloadRequest();
    }
  };

  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed #333",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a",
      }}>
        <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
          Metadata Editor is in compact mode.
        </p>
        <button
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#ffffff",
            backgroundColor: "#8b5cf6",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={handleEnterFullTab}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={uniqueWrapperClass} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <style>{`
        .${uniqueWrapperClass} .metadata-exit-icon {
          opacity: 0.6;
          transition: opacity 0.2s ease-in-out;
        }
        .${uniqueWrapperClass} .metadata-exit-icon:hover {
          opacity: 1;
        }
        .datacore-container { display: flex; flex-direction: column; gap: 16px; height: 100%; width: 100%; padding: 24px; background-color: #000000; box-sizing: border-box; overflow-y: auto; }
        .datacore-panel { background-color: #0a0a0a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; min-height: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.5); border: 1px solid #1a1a1a; }
        .datacore-file-panel { min-height: 150px; flex-shrink: 0; gap: 10px; }
        .datacore-editor-panel { flex-grow: 1; position: relative; gap: 12px; }
        .datacore-file-list { flex: 1; overflow-y: auto; margin-bottom: 10px; }
        .datacore-input, .datacore-select, .datacore-container textarea { 
          width: 100%; 
          padding: 10px 12px; 
          box-sizing: border-box; 
          background-color: #1a1a1a; 
          border: 1px solid #333; 
          border-radius: 10px; 
          color: #ffffff !important; 
          font-family: inherit; 
          font-size: 14px; 
          transition: border 120ms ease, box-shadow 120ms ease; 
        }
        .datacore-input::placeholder { color: #666; }
        .datacore-select { 
          appearance: none; 
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="%23888" d="M6 9L1 4h10z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
          color: #ffffff !important;
        }
        .datacore-select:disabled { opacity: 0.5; cursor: not-allowed; }
        .datacore-select option { background-color: #1a1a1a !important; color: #ffffff !important; padding: 10px 12px; font-size: 14px; }
        .datacore-input:focus, .datacore-select:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25); }
        .datacore-input.is-valid { border-left: 3px solid #10b981; }
        .datacore-input.is-invalid { border-left: 3px solid #ef4444; }
        .datacore-path-input-group { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .datacore-remove-button { background-color: #ef4444; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
        .datacore-add-path-button { background: linear-gradient(180deg, #8b5cf6, #7c3aed); color: #ffffff; border: none; padding: 12px; width: 100%; margin-top: 5px; border-radius: 10px; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .datacore-add-path-button:hover { background: linear-gradient(180deg, #7c3aed, #6d28d9); }
        .datacore-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
        .datacore-bulk-edit-group { display: flex; align-items: flex-start; gap: 10px; flex-grow: 1; min-width: 320px; }
        .datacore-bulk-actions { display: flex; gap: 8px; }
        .datacore-tabs { display: flex; flex-wrap: wrap; border-bottom: 1px solid #333; gap: 6px; padding-bottom: 6px; }
        .datacore-tab { background: #1a1a1a; border: 1px solid #333; padding: 8px 12px; cursor: pointer; color: #888; border-radius: 999px; transition: all 0.2s ease; }
        .datacore-tab:hover { color: #ffffff; border-color: #8b5cf6; }
        .datacore-tab.is-active { color: #ffffff; font-weight: 700; border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }
        .datacore-table-container { flex: 1; overflow-y: auto; border: 1px solid #333; border-radius: 10px; margin-top: 8px; background-color: #0a0a0a; }
        .datacore-table { width: 100%; border-collapse: collapse; }
        .datacore-table th, .datacore-table td { padding: 12px; border-bottom: 1px solid #1a1a1a; text-align: left; vertical-align: middle; color: #ffffff; }
        .datacore-table th { background-color: #000000; font-weight: 700; color: #888; position: sticky; top: 0; z-index: 1; }
        .datacore-table tr:hover { background-color: #0f0f0f; }
        .datacore-table tr:last-child td { border-bottom: none; }
        .datacore-table code { background-color: #1a1a1a; padding: 4px 8px; border-radius: 6px; color: #8b5cf6; }
        .datacore-checkbox { transform: scale(1.2); cursor: pointer; accent-color: #8b5cf6; }
        .datacore-button, .datacore-icon-button { padding: 10px 16px; background-color: #8b5cf6; color: #ffffff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: filter 120ms ease, transform 60ms ease; display: inline-flex; align-items: center; justify-content: center; }
        .datacore-button:hover { filter: brightness(1.15); }
        .datacore-button:active { transform: translateY(1px); }
        .datacore-button-danger { background-color: #ef4444; color: white; }
        .datacore-button-danger:hover { filter: brightness(1.15); }
        .datacore-button-secondary { background-color: #333; color: #ffffff; }
        .datacore-button-secondary:hover { background-color: #444; }
        .datacore-icon-button { background: none; color: #888; font-size: 18px; padding: 4px; border-radius: 8px; }
        .datacore-icon-button:hover { color: #ef4444; background: #1a1a1a; }
        .datacore-empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; color: #666; gap: 6px; min-height: 200px; }
        .datacore-status-bar { flex-shrink: 0; border-top: 1px solid #333; padding-top: 12px; font-size: 13px; color: #888; }
        .status-success { color: #10b981; } .status-error { color: #ef4444; }
        .datacore-modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.8); z-index: 100; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); padding: 16px; }
        .datacore-modal { background-color: #0a0a0a; padding: 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 560px; border: 1px solid #1a1a1a; }
        .datacore-modal h3 { color: #ffffff; margin: 0 0 8px 0; }
        .datacore-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .datacore-loading-overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,0.8); z-index: 10; display: flex; justify-content: center; align-items: center; border-radius: 12px; }
        .datacore-spinner { width: 44px; height: 44px; border: 4px solid #333; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .datacore-list-editor { display: flex; flex-direction: column; gap: 8px; }
        .datacore-list-items { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
        .datacore-list-item { display: flex; justify-content: space-between; align-items: center; background-color: #1a1a1a; padding: 8px 10px; border-radius: 8px; color: #ffffff; }
        .datacore-empty-list-text { color: #666; font-style: italic; padding: 6px 10px; }
        .datacore-list-add { display: flex; gap: 8px; }
        .datacore-list-add .datacore-button { padding: 8px 12px; }
        .datacore-bulk-list-wrap { flex: 1; min-width: 320px; }
        .datacore-checkbox-row { display: flex; align-items: center; gap: 10px; }
        .datacore-checkbox-label { color: #888; }
        .datacore-add-single { margin-top: 12px; padding: 12px; border: 1px dashed #333; border-radius: 12px; background: #0a0a0a; }
        .datacore-add-single h4 { color: #ffffff; margin: 0 0 12px 0; }
        .datacore-add-grid { display: grid; grid-template-columns: 1.2fr 0.8fr 2fr auto; gap: 10px; align-items: start; }
        .datacore-add-list { grid-column: span 2; }
        .datacore-add-single-btn { white-space: nowrap; }
        .datacore-segment { display: inline-flex; background: #1a1a1a; border: 1px solid #333; border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
        .datacore-segment .seg { padding: 6px 10px; cursor: pointer; color: #888; }
        .datacore-segment .seg.active { background: rgba(139, 92, 246, 0.2); color: #ffffff; font-weight: 700; }
      `}</style>
      <div className="datacore-container">
        {/* Close Mode button */}
        <div
          className="metadata-exit-icon"
          onClick={handleExitFullTab}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#8b5cf6",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "6px"
          }}
        >
          <dc.Icon icon="minimize-2" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
          <span>Exit Full Tab</span>
        </div>

        {/* File selection panel */}
        <FilePanel
          dc={dc}
          fileInputs={fileInputs}
          handlePathChange={handlePathChange}
          removeFileInput={removeFileInput}
          addFileInput={addFileInput}
        />

        {/* Editor panel */}
        <div className="datacore-panel datacore-editor-panel">
          {isLoading && <div className="datacore-loading-overlay"><div className="datacore-spinner"></div></div>}
          
          <BulkOperations
            dc={dc}
            validFiles={validFiles}
            allUniqueKeys={allUniqueKeys}
            propertyTypes={propertyTypes}
            bulkMode={bulkMode}
            setBulkMode={setBulkMode}
            bulkEditKey={bulkEditKey}
            setBulkEditKey={setBulkEditKey}
            bulkEditValue={bulkEditValue}
            setBulkEditValue={setBulkEditValue}
            bulkEditList={bulkEditList}
            setBulkEditList={setBulkEditList}
            bulkEditListMode={bulkEditListMode}
            setBulkEditListMode={setBulkEditListMode}
            bulkAddKey={bulkAddKey}
            setBulkAddKey={setBulkAddKey}
            bulkAddType={bulkAddType}
            setBulkAddType={setBulkAddType}
            bulkAddValue={bulkAddValue}
            setBulkAddValue={setBulkAddValue}
            bulkAddList={bulkAddList}
            setBulkAddList={setBulkAddList}
            bulkAddListMode={bulkAddListMode}
            setBulkAddListMode={setBulkAddListMode}
            handleBulkUpdate={handleBulkUpdate}
            handleBulkAdd={handleBulkAdd}
            handleBulkDelete={handleBulkDelete}
            currentBulkType={currentBulkType}
          />

          <EditorPanel
            dc={dc}
            validFiles={validFiles}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            activeFile={activeFile}
            activeFrontmatter={activeFrontmatter}
            propertyTypes={propertyTypes}
            handleUpdateProperty={handleUpdateProperty}
            handleDeleteProperty={handleDeleteProperty}
            handleAddItemToList={handleAddItemToList}
            handleRemoveItemFromList={handleRemoveItemFromList}
            newPropKey={newPropKey}
            setNewPropKey={setNewPropKey}
            newPropType={newPropType}
            setNewPropType={setNewPropType}
            newPropValue={newPropValue}
            setNewPropValue={setNewPropValue}
            newPropList={newPropList}
            setNewPropList={setNewPropList}
            handleAddSingleProperty={handleAddSingleProperty}
          />
        </div>

        {/* Status bar */}
        <div className={`datacore-status-bar status-${status.type}`}>
          <b>Status:</b> {status.message}
        </div>
      </div>

      {/* MCP sync bridge */}
      {componentDir && (
        <MCPBridge
          folderPath={componentDir}
          validFiles={validFiles}
          allKeys={allUniqueKeys}
          onReload={handleCodeReload}
        />
      )}
    </div>
  );
}

return { App };
