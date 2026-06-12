```datacorejsx
const activeFile = dc.resolvePath("METADATA EDIT") || "_RESOURCES/DATACORE/_DONE/MetadataEdit/METADATA EDIT";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
