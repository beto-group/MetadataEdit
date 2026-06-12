function BulkOperations({
  dc,
  ListEditorCell,
  PROPERTY_TYPES_CONFIG,
  validFiles,
  allUniqueKeys,
  bulkMode,
  setBulkMode,
  bulkEditKey,
  setBulkEditKey,
  bulkEditValue,
  setBulkEditValue,
  bulkEditList,
  setBulkEditList,
  bulkEditListMode,
  setBulkEditListMode,
  bulkAddKey,
  setBulkAddKey,
  bulkAddType,
  setBulkAddType,
  bulkAddValue,
  setBulkAddValue,
  bulkAddList,
  setBulkAddList,
  bulkAddListMode,
  setBulkAddListMode,
  handleBulkUpdate,
  handleBulkAdd,
  handleBulkDelete,
  currentBulkType
}) {
  return (
    <div className="datacore-toolbar">
      <div className="datacore-bulk-edit-group">
        <select 
          className="datacore-select" 
          value={bulkEditKey} 
          onChange={e => { setBulkEditKey(e.target.value); setBulkEditValue(''); }}
          style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)', padding: '8px', minHeight: '36px' }}
        >
          <option value="" style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>Bulk Edit a Property...</option>
          {allUniqueKeys.map(key => <option key={key} value={key} style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>{key}</option>)}
        </select>
        {bulkEditKey && (
          <>
            {currentBulkType === 'list' ? (
              <div className="datacore-bulk-list-wrap">
                <div className="datacore-segment">
                  <label className={`seg ${bulkEditListMode==='replace'?'active':''}`} onClick={()=>setBulkEditListMode('replace')}>Replace</label>
                  <label className={`seg ${bulkEditListMode==='append'?'active':''}`} onClick={()=>setBulkEditListMode('append')}>Append</label>
                  <label className={`seg ${bulkEditListMode==='remove'?'active':''}`} onClick={()=>setBulkEditListMode('remove')}>Remove</label>
                </div>
                <ListEditorCell
                  dc={dc}
                  items={bulkEditList}
                  onAddItem={(it) => setBulkEditList(prev => [...prev, it])}
                  onRemoveItem={(idx) => setBulkEditList(prev => prev.filter((_, i) => i !== idx))}
                  placeholder="Add list item..."
                />
              </div>
            ) : currentBulkType === 'checkbox' ? (
              <input
                type="checkbox"
                checked={['true', '1', 'yes', 'on', 'checked'].includes(String(bulkEditValue).toLowerCase())}
                onChange={(e) => setBulkEditValue(e.target.checked ? 'true' : 'false')}
                className="datacore-checkbox"
              />
            ) : currentBulkType === 'number' ? (
              <input
                type="number"
                step="any"
                value={bulkEditValue}
                onChange={e => setBulkEditValue(e.target.value)}
                placeholder={PROPERTY_TYPES_CONFIG.number.placeholder}
                className="datacore-input"
              />
            ) : currentBulkType === 'date' ? (
              <input
                type="date"
                value={bulkEditValue}
                onChange={e => setBulkEditValue(e.target.value)}
                placeholder={PROPERTY_TYPES_CONFIG.date.placeholder}
                className="datacore-input"
              />
            ) : currentBulkType === 'datetime' ? (
              <input
                type="datetime-local"
                value={bulkEditValue}
                onChange={e => setBulkEditValue(e.target.value)}
                placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder}
                className="datacore-input"
              />
            ) : (
              <input
                type="text"
                value={bulkEditValue}
                onChange={e => setBulkEditValue(e.target.value)}
                placeholder={PROPERTY_TYPES_CONFIG.text.placeholder}
                className="datacore-input"
              />
            )}
            <button onClick={handleBulkUpdate} className="datacore-button">Update All</button>
          </>
        )}
      </div>
      <div className="datacore-bulk-actions">
        <button onClick={() => setBulkMode(bulkMode === 'add' ? null : 'add')} className="datacore-button">
          <dc.Icon icon="plus" style={{ marginRight: "4px" }} />
          Bulk Add
        </button>
        <button onClick={() => setBulkMode(bulkMode === 'delete' ? null : 'delete')} className="datacore-button-danger">
          <dc.Icon icon="trash-2" style={{ marginRight: "4px" }} />
          Bulk Delete
        </button>
      </div>

      {bulkMode === 'add' && (
        <div className="datacore-modal-backdrop" onClick={() => setBulkMode(null)}>
          <div className="datacore-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Property to {validFiles.length} Files</h3>
            <input type="text" value={bulkAddKey} onChange={e => setBulkAddKey(e.target.value)} placeholder="New Property Key" className="datacore-input" />
            <select 
              value={bulkAddType} 
              onChange={e => { setBulkAddType(e.target.value); setBulkAddValue(''); setBulkAddList([]); }} 
              className="datacore-select"
              style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)', padding: '8px', minHeight: '36px' }}
            >
              {Object.entries(PROPERTY_TYPES_CONFIG).map(([id, config]) => <option key={id} value={id} style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>{config.display}</option>)}
            </select>
            {bulkAddType === 'list' ? (
              <>
                <div className="datacore-segment">
                  <label className={`seg ${bulkAddListMode==='replace'?'active':''}`} onClick={()=>setBulkAddListMode('replace')}>Replace if exists</label>
                  <label className={`seg ${bulkAddListMode==='append'?'active':''}`} onClick={()=>setBulkAddListMode('append')}>Append if exists</label>
                </div>
                <ListEditorCell
                  dc={dc}
                  items={bulkAddList}
                  onAddItem={(it) => setBulkAddList(prev => [...prev, it])}
                  onRemoveItem={(idx) => setBulkAddList(prev => prev.filter((_, i) => i !== idx))}
                  placeholder="Add list item..."
                />
              </>
            ) : bulkAddType === 'checkbox' ? (
              <div className="datacore-checkbox-row">
                <label className="datacore-checkbox-label">Checked</label>
                <input
                  type="checkbox"
                  checked={['true', '1', 'yes', 'on', 'checked'].includes(String(bulkAddValue).toLowerCase())}
                  onChange={(e) => setBulkAddValue(e.target.checked ? 'true' : 'false')}
                  className="datacore-checkbox"
                />
              </div>
            ) : bulkAddType === 'number' ? (
              <input type="number" step="any" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.number.placeholder} className="datacore-input" />
            ) : bulkAddType === 'date' ? (
              <input type="date" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.date.placeholder} className="datacore-input" />
            ) : bulkAddType === 'datetime' ? (
              <input type="datetime-local" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG.datetime.placeholder} className="datacore-input" />
            ) : (
              <input type="text" value={bulkAddValue} onChange={e => setBulkAddValue(e.target.value)} placeholder={PROPERTY_TYPES_CONFIG[bulkAddType].placeholder} className="datacore-input" />
            )}
            <div className="datacore-modal-actions">
              <button onClick={() => setBulkMode(null)} className="datacore-button-secondary">Cancel</button>
              <button onClick={handleBulkAdd} disabled={!bulkAddKey.trim()} className="datacore-button">Add to All</button>
            </div>
          </div>
        </div>
      )}

      {bulkMode === 'delete' && (
        <div className="datacore-modal-backdrop" onClick={() => setBulkMode(null)}>
          <div className="datacore-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Property from {validFiles.length} Files</h3>
            <select 
              className="datacore-select" 
              value={bulkEditKey} 
              onChange={e => setBulkEditKey(e.target.value)}
              style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)', padding: '8px', minHeight: '36px' }}
            >
              <option value="" style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>Select property to delete...</option>
              {allUniqueKeys.map(key => <option key={key} value={key} style={{ color: 'var(--text-normal)', backgroundColor: 'var(--background-modifier-form-field)' }}>{key}</option>)}
            </select>
            <div className="datacore-modal-actions">
              <button onClick={() => setBulkMode(null)} className="datacore-button-secondary">Cancel</button>
              <button onClick={handleBulkDelete} disabled={!bulkEditKey} className="datacore-button-danger">Delete from All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

return { BulkOperations };
