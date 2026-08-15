const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const rootPackageJsonPath = path.join(rootDir, "package.json");
const rootPackageLockPath = path.join(rootDir, "package-lock.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

function isValidSemVer(version) {
  const semVerPattern =
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
  return semVerPattern.test(version);
}

function updatePackageFiles(packageDir, version) {
  const packageJsonPath = path.join(rootDir, packageDir, "package.json");
  const packageLockPath = path.join(rootDir, packageDir, "package-lock.json");

  const packageJson = readJson(packageJsonPath);
  packageJson.version = version;
  writeJson(packageJsonPath, packageJson);

  if (fs.existsSync(packageLockPath)) {
    const packageLock = readJson(packageLockPath);
    packageLock.version = version;
    if (packageLock.packages && packageLock.packages[""]) {
      packageLock.packages[""].version = version;
    }
    writeJson(packageLockPath, packageLock);
  }
}

function updateRootLockFile(version) {
  if (!fs.existsSync(rootPackageLockPath)) {
    return;
  }

  const rootLock = readJson(rootPackageLockPath);
  rootLock.version = version;
  if (rootLock.packages && rootLock.packages[""]) {
    rootLock.packages[""].version = version;
  }
  writeJson(rootPackageLockPath, rootLock);
}

function updateDotnetSharedVersion(version) {
  const [major, minor, patch] = version.split(".");
  const assemblyVersion = `${major}.${minor}.${patch}.0`;
  const propsPath = path.join(rootDir, "backend", "services", "Directory.Build.props");
  const propsContent = `<Project>
  <PropertyGroup>
    <Version>${version}</Version>
    <InformationalVersion>${version}</InformationalVersion>
    <AssemblyVersion>${assemblyVersion}</AssemblyVersion>
    <FileVersion>${assemblyVersion}</FileVersion>
  </PropertyGroup>
</Project>
`;

  fs.writeFileSync(propsPath, propsContent, "utf8");
}

function updateComposeImageTags(version) {
  const composePath = path.join(rootDir, "docker-compose.lab.yml");
  if (!fs.existsSync(composePath)) {
    return;
  }

  const composeContent = fs.readFileSync(composePath, "utf8");
  const updatedComposeContent = composeContent.replace(
    /(image:\s+proyecto-muebles\/[a-z-]+:)(?:\$\{APP_VERSION:-[^}]+\}|[^\s]+)/g,
    `$1\${APP_VERSION:-${version}}`
  );

  fs.writeFileSync(composePath, updatedComposeContent, "utf8");
}

function main() {
  const rootPackageJson = readJson(rootPackageJsonPath);
  const { version } = rootPackageJson;

  if (!version || !isValidSemVer(version)) {
    throw new Error(`Version SemVer invalida en package.json de raiz: ${version}`);
  }

  updateRootLockFile(version);
  updatePackageFiles("frontend", version);
  updatePackageFiles(path.join("backend", "node-api-gateway"), version);
  updateDotnetSharedVersion(version);
  updateComposeImageTags(version);

  console.log(`Version sincronizada correctamente: ${version}`);
}

main();
