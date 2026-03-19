import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const defaultRootDir = path.resolve(scriptDir, "..");

function toPosixPath(filePath) {
    return filePath.split(path.sep).join("/");
}

function escapeGitHubOutput(value) {
    return String(value)
        .replace(/%/g, "%25")
        .replace(/\r/g, "%0D")
        .replace(/\n/g, "%0A");
}

export async function loadReleaseMetadata(rootDir = defaultRootDir) {
    const packageJsonPath = path.join(rootDir, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    const version = packageJson.version;
    const productName = packageJson.build?.productName || packageJson.name;
    const portableFileName = `${productName}-${version}-portable.exe`;
    const portablePath = path.join(rootDir, "release", portableFileName);
    const portableRelativePath = toPosixPath(path.relative(rootDir, portablePath));
    const artifactSlug = String(packageJson.name || productName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const releaseTag = `v${version}`;

    return {
        version,
        productName,
        releaseTag,
        releaseTitle: `${productName} ${releaseTag}`,
        portableFileName,
        portablePath,
        portableRelativePath,
        portableArtifactName: `${artifactSlug}-windows-portable-${releaseTag}`
    };
}

async function writeGitHubOutput(metadata) {
    const outputFile = process.env.GITHUB_OUTPUT;

    if (!outputFile) {
        throw new Error("缺少 GITHUB_OUTPUT 环境变量");
    }

    const pairs = {
        version: metadata.version,
        product_name: metadata.productName,
        release_tag: metadata.releaseTag,
        release_title: metadata.releaseTitle,
        portable_file_name: metadata.portableFileName,
        portable_path: metadata.portableRelativePath,
        portable_artifact_name: metadata.portableArtifactName
    };

    const content = Object.entries(pairs)
        .map(([key, value]) => `${key}=${escapeGitHubOutput(value)}`)
        .join("\n");

    await appendFile(outputFile, `${content}\n`, "utf8");
}

async function main() {
    const metadata = await loadReleaseMetadata(process.cwd());

    if (process.argv.includes("--github-output")) {
        await writeGitHubOutput(metadata);
        return;
    }

    console.log(JSON.stringify({
        version: metadata.version,
        productName: metadata.productName,
        releaseTag: metadata.releaseTag,
        portableFileName: metadata.portableFileName,
        portablePath: metadata.portableRelativePath,
        portableArtifactName: metadata.portableArtifactName
    }, null, 2));
}

if (path.resolve(process.argv[1] || "") === scriptFile) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}