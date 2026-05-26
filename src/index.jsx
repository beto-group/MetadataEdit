const { useState, useEffect } = dc;
const { App } = await dc.require(dc.resolvePath("METADATA EDIT/src/App.jsx"));

const RootView = (props) => {
  const [stamp, setStamp] = useState(0);

  useEffect(() => {
    const handleModify = (file) => {
      if (file && file.path && file.path.includes("METADATA EDIT/src/")) {
        console.log(`[Metadata Edit] Source file modified: ${file.path}. Re-evaluating...`);
        setStamp(Date.now());
      }
    };

    app.vault.on("modify", handleModify);

    return () => {
      app.vault.off("modify", handleModify);
    };
  }, []);

  const handleManualReload = () => {
    setStamp(Date.now());
  };

  return <App key={stamp} dc={dc} onCodeReloadRequest={handleManualReload} {...props} />;
};

return { View: RootView };
