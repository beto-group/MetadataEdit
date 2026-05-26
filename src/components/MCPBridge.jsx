function MCPBridge({ folderPath, validFiles, allKeys, onReload }) {
    const { useEffect } = dc;
    
    const STATE_FILE = folderPath + '/data/mcp_state.json';
    const COMMAND_FILE = folderPath + '/data/mcp_commands.json';

    useEffect(() => {
        const adapter = dc.app.vault.adapter;

        const updateState = async () => {
            const state = {
                timestamp: new Date().toISOString(),
                folderPath,
                loadedFiles: validFiles.map(f => f.path),
                availableKeys: allKeys,
                status: "active",
                version: "1.0.1",
                component: "MetadataEdit"
            };
            try {
                const parentDir = STATE_FILE.substring(0, STATE_FILE.lastIndexOf("/"));
                if (!(await adapter.exists(parentDir))) {
                    await adapter.mkdir(parentDir);
                }
                await adapter.write(STATE_FILE, JSON.stringify(state, null, 2));
            } catch (e) {
                console.error("[MCPBridge] Failed to write state:", e);
            }
        };

        const checkCommands = async () => {
            if (!(await adapter.exists(COMMAND_FILE))) return;
            try {
                const content = await adapter.read(COMMAND_FILE);
                const cmd = JSON.parse(content);
                if (cmd && cmd.executed === false) {
                    cmd.executed = true;
                    cmd.executedAt = new Date().toISOString();
                    await adapter.write(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    
                    if (cmd.action === 'reload') {
                        if (onReload) onReload();
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        };

        updateState();
        const interval = setInterval(() => {
            updateState();
            checkCommands();
        }, 2000);
        
        return () => clearInterval(interval);
    }, [validFiles, allKeys]);

    return null;
}

return { MCPBridge };
