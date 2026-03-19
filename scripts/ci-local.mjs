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

async function main() {
    const releaseMetadata = await loadReleaseMetadata(rootDir);

    await cleanArtifacts(releaseMetadata.portablePath);
    await runStep("运行网页测试", ["test"]);
    await runStep("打包 Windows 便携版", ["run", "desktop:pack"]);
    await validateArtifact(releaseMetadata.portablePath);
    console.log(`CI_LOCAL_OK ${releaseMetadata.portablePath}`);
}

async function cleanArtifacts(portablePath) {
    await rm(portablePath, { force: true });
    await rm(winUnpackedDir, { recursive: true, force: true });
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
