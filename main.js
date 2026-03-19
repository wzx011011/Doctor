const path = require("node:path");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { app, BrowserWindow, ipcMain } = require("electron");

app.setAppUserModelId("local.doctor.register");

function getRecordFilePath() {
    return path.join(app.getPath("documents"), "DoctorRegister", "doctor-records.json");
}

function normalizeStoredRecords(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.records)) {
        return payload.records;
    }

    if (payload && payload.data && Array.isArray(payload.data.records)) {
        return payload.data.records;
    }

    return [];
}

async function loadDesktopRecords() {
    const filePath = getRecordFilePath();

    try {
        const content = await readFile(filePath, "utf8");
        const parsed = JSON.parse(content);

        return {
            exists: true,
            filePath,
            records: normalizeStoredRecords(parsed)
        };
    } catch (error) {
        if (error && error.code === "ENOENT") {
            return {
                exists: false,
                filePath,
                records: []
            };
        }

        throw error;
    }
}

async function saveDesktopRecords(records) {
    const filePath = getRecordFilePath();

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        records: Array.isArray(records) ? records : []
    }, null, 2), "utf8");

    return { filePath };
}

ipcMain.handle("doctor-storage:load-records", async () => loadDesktopRecords());
ipcMain.handle("doctor-storage:save-records", async (_event, records) => saveDesktopRecords(records));

function createWindow() {
    const win = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 1100,
        minHeight: 760,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: "#f3efe7",
        title: "病人问诊记录登记统计",
        icon: path.join(__dirname, "assets", "app-icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.loadFile(path.join(__dirname, "index.html"), {
        query: {
            demo: "off",
            desktop: "1"
        }
    });

    win.once("ready-to-show", () => {
        win.show();
    });

    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

    return win;
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});