const path = require("node:path");
const { app, BrowserWindow } = require("electron");

app.setAppUserModelId("local.doctor.register");

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