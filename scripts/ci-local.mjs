import { spawn } from "node:child_process";
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { loadReleaseMetadata } from "./release-meta.mjs";

const rootDir = process.cwd();
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const releaseDir = path.join(rootDir, "release");
const winUnpackedDir = path.join(releaseDir, "win-unpacked");
const CLEAN_RETRY_DELAY_MS = 600;
const CLEAN_RETRY_COUNT = 5;

async function main() {
    const releaseMetadata = await loadReleaseMetadata(rootDir);

    await cleanArtifacts(releaseMetadata.portablePath);
    await runStep("运行网页测试", ["test"]);
    await runStep("打包 Windows 便携版", ["run", "desktop:pack"]);
    await validateArtifact(releaseMetadata.portablePath);
    console.log(`CI_LOCAL_OK ${releaseMetadata.portablePath}`);
}

async function cleanArtifacts(portablePath) {
    await stopRunningDoctorProcesses();
    await removeWithRetry(portablePath, { force: true });
    await removeWithRetry(winUnpackedDir, { recursive: true, force: true });
}

async function stopRunningDoctorProcesses() {
    if (!isWindows) {
        return;
    }

    await new Promise((resolve, reject) => {
        const child = spawn("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-Process | Where-Object { $_.ProcessName -like 'DoctorRegister*' } | Stop-Process -Force -ErrorAction SilentlyContinue"
        ], {
            cwd: rootDir,
            stdio: "ignore"
        });

        child.on("exit", () => resolve());
        child.on("error", reject);
    });

    await wait(800);
}

async function removeWithRetry(targetPath, options) {
    for (let attempt = 0; attempt <= CLEAN_RETRY_COUNT; attempt += 1) {
        try {
            await rm(targetPath, options);
            return;
        } catch (error) {
            const errorCode = error && typeof error === "object" ? error.code : "";
            const shouldRetry = isWindows && ["EBUSY", "EPERM"].includes(String(errorCode));

            if (!shouldRetry || attempt === CLEAN_RETRY_COUNT) {
                throw error;
            }

            await wait(CLEAN_RETRY_DELAY_MS * (attempt + 1));
        }
    }
}

function wait(durationMs) {
    return new Promise((resolve) => {
        setTimeout(resolve, durationMs);
    });
}

function runStep(label, args) {
    return new Promise((resolve, reject) => {
        console.log(`\n== ${label} ==`);
        const child = spawn(npmCommand, args, {
            cwd: rootDir,
            shell: isWindows,
            stdio: "inherit",
            env: {
                ...process.env,
                CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY || "false"
            }
        });

        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`${label}失败，退出码 ${code}`));
        });

        child.on("error", reject);
    });
}

async function validateArtifact(portablePath) {
    const file = await stat(portablePath);

    if (!file.isFile() || file.size <= 0) {
        throw new Error("未生成有效的 portable exe 文件");
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
