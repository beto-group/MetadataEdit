```datacorejsx
const activeFile = dc.resolvePath("MetadataEdit") || "_RESOURCES/DATACORE/_DONE/MetadataEdit/MetadataEdit";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
