const { useState, useEffect } = dc;

const PROPERTY_TYPES_CONFIG = {
  text: { display: 'Text', placeholder: 'Enter any text...' },
  number: { display: 'Number', placeholder: 'e.g., 42 or 3.14' },
  checkbox: { display: 'Checkbox', placeholder: 'true or false' },
  list: { display: 'List', placeholder: 'Add items below' },
  date: { display: 'Date', placeholder: 'YYYY-MM-DD' },
  datetime: { display: 'Date & time', placeholder: 'YYYY-MM-DDTHH:MM' },
};

function inferTypeFromValue(value) {
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return 'datetime';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  }
  return 'text';
}

function getPropertyType(key, value, allKnownTypes) {
  return allKnownTypes[key]?.type || inferTypeFromValue(value);
}

function convertValueToType(raw, newType) {
  if (newType === 'list' && Array.isArray(raw)) return raw.slice();
  const trimmed = (typeof raw === 'string') ? raw.trim() : raw;
  switch (newType) {
    case 'number': {
      const n = parseFloat(String(trimmed));
      return Number.isFinite(n) ? n : 0;
    }
    case 'checkbox':
      return ['true', '1', 'yes', 'on', 'checked'].includes(String(trimmed).toLowerCase());
    case 'list':
      try {
        if (typeof trimmed !== 'string') return Array.isArray(trimmed) ? trimmed : [String(trimmed)];
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (!trimmed) return [];
        return [String(trimmed)];
      }
    case 'date':
      return String(trimmed).slice(0, 10);
    case 'datetime':
      return String(trimmed).replace(' ', 'T').slice(0, 16);
    default:
      return String(trimmed ?? '');
  }
}

function ListEditorCell({ dc, items, onAddItem, onRemoveItem, placeholder = "New list item..." }) {
  const [newItem, setNewItem] = useState("");
  const handleAdd = () => {
    if (newItem.trim()) {
      onAddItem(newItem);
      setNewItem("");
    }
  };
  return (
    <div className="datacore-list-editor">
      {items.length > 0 ? (
        <div className="datacore-list-items">
          {items.map((item, index) => (
            <div key={index} className="datacore-list-item">
              <span>{String(item)}</span>
              <button onClick={() => onRemoveItem(index)} className="datacore-icon-button" title="Remove item">
                <dc.Icon icon="x" />
              </button>
            </div>
          ))}
        </div>
      ) : <p className="datacore-empty-list-text">(empty list)</p>}
      <div className="datacore-list-add">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder={placeholder}
          className="datacore-input"
        />
        <button onClick={handleAdd} className="datacore-button">
          <dc.Icon icon="plus" />
        </button>
      </div>
    </div>
  );
}

function PropertyValueCell({ type, value, onSave, onAddItem, onRemoveItem, dc }) {
  if (type === 'list' && Array.isArray(value)) {
    return (
      <ListEditorCell
        dc={dc}
        items={value}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />
    );
  }
  const formatValueForInput = (val) => {
    if (val === null || typeof val === 'undefined') return '';
    if (type === 'date' && typeof val === 'string') return val.split('T')[0];
    if (type === 'datetime' && typeof val === 'string') return val.replace(' ', 'T').slice(0, 16);
    return String(val);
  };
  const [localValue, setLocalValue] = useState(() => formatValueForInput(value));
  useEffect(() => { setLocalValue(formatValueForInput(value)); }, [value, type]);
  const handleSave = () => {
    const formatted = formatValueForInput(value);
    if (localValue !== formatted) onSave(convertValueToType(localValue, type));
  };
  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onSave(e.target.checked)}
        className="datacore-checkbox"
      />
    );
  }
  const inputProps = {
    value: localValue,
    onBlur: handleSave,
    onChange: e => setLocalValue(e.target.value),
    onKeyDown: (e) => { if (e.key === 'Enter') e.target.blur() },
    className: "datacore-input"
  };
  if (type === 'number') return <input type="number" step="any" {...inputProps} />;
  if (type === 'date') return <input type="date" {...inputProps} />;
  if (type === 'datetime') return <input type="datetime-local" {...inputProps} />;
  return <input type="text" {...inputProps} />;
}

function EditorPanel({
  dc,
  validFiles,
  activeFileIndex,
  setActiveFileIndex,
  activeFile,
  activeFrontmatter,
  propertyTypes,
  handleUpdateProperty,
  handleDeleteProperty,
  handleAddItemToList,
  handleRemoveItemFromList,
  newPropKey,
  setNewPropKey,
  newPropType,
  setNewPropType,
  newPropValue,
  setNewPropValue,
  newPropList,
  setNewPropList,
  handleAddSingleProperty
}) {
  return (
    <div className="datacore-panel datacore-editor-panel">
      {validFiles.length > 0 ? (
        <>
          <div className="datacore-tabs">
            {validFiles.map((file, index) => (
              <button key={file.path} onClick={() => setActiveFileIndex(index)} className={`datacore-tab ${index === activeFileIndex ? 'is-active' : ''}`}>{file.basename}</button>
            ))}
          </div>

          <div className="datacore-table-container">
            {activeFile && activeFrontmatter ? (
              <table className="datacore-table">
                <thead><tr><th>Attribute</th><th>Type</th><th>Value</th><th>Actions</th></tr></thead>
                <tbody>
                {Object.entries(activeFrontmatter).sort(([a],[b]) => a.localeCompare(b)).map(([key, value]) => {
                  const currentType = getPropertyType(key, value, propertyTypes);
                  return (
                    <tr key={key}>
                      <td><code>{key}</code></td>
                      <td>
                        <select 
                          value={currentType} 
                          disabled 
                          className="datacore-select"
                          style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)', padding: '8px', minHeight: '36px' }}
                        >
                          {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>{config.display}</option>)}
                        </select>
                      </td>
                      <td>
                        <PropertyValueCell
                          dc={dc}
                          type={currentType}
                          value={value}
                          onSave={(val) => handleUpdateProperty(activeFile, key, val)}
                          onAddItem={(item) => handleAddItemToList(activeFile, key, item)}
                          onRemoveItem={(index) => handleRemoveItemFromList(activeFile, key, index)}
                        />
                      </td>
                      <td>
                        <button onClick={() => handleDeleteProperty(activeFile, key)} className="datacore-icon-button" title={`Delete '${key}'`}>
                          <dc.Icon icon="trash-2" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            ) : (
              <div className="datacore-empty-state"><p>Select a file tab to view its properties.</p></div>
            )}
          </div>

          {activeFile && (
            <div className="datacore-add-single">
              <h4>Add Property to This File</h4>
              <div className="datacore-add-grid">
                <input type="text" value={newPropKey} onChange={e => setNewPropKey(e.target.value)} placeholder="Property key" className="datacore-input" />
                <select value={newPropType} onChange={e => { setNewPropType(e.target.value); setNewPropValue(''); setNewPropList([]); }} className="datacore-select" style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)', padding: '8px', minHeight: '36px' }}>
                  {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>{config.display}</option>)}
                </select>
                {newPropType === 'list' ? (
                  <div className="datacore-add-list">
                    <ListEditorCell
                      dc={dc}
                      items={newPropList}
                      onAddItem={(it) => setNewPropList(prev => [...prev, it])}
                      onRemoveItem={(idx) => setNewPropList(prev => prev.filter((_, i) => i !== idx))}
                      placeholder="Add list item..."
                    />
                  </div>
                ) : newPropType === 'checkbox' ? (
                  <div className="datacore-checkbox-row">
                    <label className="datacore-checkbox-label">Checked</label>
                    <input
                      type="checkbox"
                      checked={['true', '1', 'yes', 'on', 'checked'].includes(String(newPropValue).toLowerCase())}
                      onChange={(e) => setNewPropValue(e.target.checked ? 'true' : 'false')}
                      className="datacore-checkbox"
                    />
                  </div>
                ) : newPropType === 'number' ? (
                  <input type="number" step="any" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.number.placeholder} className="datacore-input" />
                ) : newPropType === 'date' ? (
                  <input type="date" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.date.placeholder} className="datacore-input" />
                ) : newPropType === 'datetime' ? (
                  <input type="datetime-local" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder} className="datacore-input" />
                ) : (
                  <input type="text" value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.text.placeholder} className="datacore-input" />
                )}
                <button onClick={handleAddSingleProperty} disabled={!newPropKey.trim()} className="datacore-button datacore-add-single-btn">Add Property</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="datacore-empty-state">
          <h3>Select Files to Begin</h3>
          <p>Add valid file paths in the top panel to start editing their frontmatter.</p>
        </div>
      )}
    </div>
  );
}

return { EditorPanel, inferTypeFromValue, convertValueToType, PROPERTY_TYPES_CONFIG, ListEditorCell };
