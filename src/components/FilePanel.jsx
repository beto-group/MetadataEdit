function FilePanel({ dc, fileInputs, handlePathChange, removeFileInput, addFileInput }) {
  return (
    <div className="datacore-panel datacore-file-panel">
      <h3 style={{ margin: "0 0 12px 0", color: "var(--text-normal)", display: "flex", alignItems: "center", gap: "8px" }}>
        <dc.Icon icon="files" style={{ color: "var(--interactive-accent)" }} />
        File Selection
      </h3>
      <div className="datacore-file-list">
        {fileInputs.map((input) => {
          const file = app.vault.getAbstractFileByPath(input.path.trim());
          const isValid = file && file.extension;
          return (
            <div key={input.id} className="datacore-path-input-group">
              <input
                type="text"
                value={input.path}
                onChange={(e) => handlePathChange(input.id, e.target.value)}
                placeholder="Path/to/file.md"
                className={`datacore-input ${input.path.trim() && (isValid ? 'is-valid' : 'is-invalid')}`}
              />
              {fileInputs.length > 1 && (
                <button onClick={() => removeFileInput(input.id)} className="datacore-remove-button" title="Remove">
                  <dc.Icon icon="x" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={addFileInput} className="datacore-add-path-button">
        <dc.Icon icon="plus" style={{ marginRight: "6px" }} />
        Add File Path
      </button>
    </div>
  );
}

return { FilePanel };
