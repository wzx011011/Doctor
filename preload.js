const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("doctorDesktopStorage", {
    loadRecords: () => ipcRenderer.invoke("doctor-storage:load-records"),
    saveRecords: (records) => ipcRenderer.invoke("doctor-storage:save-records", records)
});