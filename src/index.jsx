function View({ folderPath, ...props }, dcOverride) {
  const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);

  function MetadataEditComponent() {
    const { useState, useEffect } = localDc;
    const [dependencies, setDependencies] = useState(null);
    const [stamp, setStamp] = useState(0);

    useEffect(() => {
      Promise.all([
        localDc.require(folderPath + "/src/utils/domUtils.js"),
        localDc.require(folderPath + "/src/components/FilePanel.jsx"),
        localDc.require(folderPath + "/src/components/EditorPanel.jsx"),
        localDc.require(folderPath + "/src/components/BulkOperations.jsx"),
        localDc.require(folderPath + "/src/components/MCPBridge.jsx"),
        localDc.require(folderPath + "/src/App.jsx")
      ]).then(([
        domUtils,
        { FilePanel },
        EditorPanelMod,
        { BulkOperations },
        { MCPBridge },
        { App }
      ]) => {
        setDependencies({
          domUtils,
          FilePanel,
          EditorPanelMod,
          BulkOperations,
          MCPBridge,
          App
        });
      }).catch(err => {
        console.error("[Metadata Edit] Failed to load dependencies:", err);
      });
    }, [stamp]);

    useEffect(() => {
      const handleModify = (file) => {
        if (file && file.path && file.path.includes("MetadataEdit/src/")) {
          console.log(`[Metadata Edit] Source file modified: ${file.path}. Re-evaluating...`);
          setStamp(Date.now());
        }
      };

      localDc.app.vault.on("modify", handleModify);

      return () => {
        localDc.app.vault.off("modify", handleModify);
      };
    }, []);

    const handleManualReload = () => {
      setStamp(Date.now());
    };

    if (!dependencies) {
      return <div style={{ color: "var(--text-muted)", fontFamily: "monospace", padding: "10px" }}>Loading Metadata Edit...</div>;
    }

    return (
      <dependencies.App
        key={stamp}
        dc={localDc}
        folderPath={folderPath}
        dependencies={dependencies}
        onCodeReloadRequest={handleManualReload}
        {...props}
      />
    );
  }

  return <MetadataEditComponent />;
}

return { View };
