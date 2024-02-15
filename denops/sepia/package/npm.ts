import { fs, is, path, PredicateType } from "../deps.ts";
import { decodeText, getPackagePath, getSymlinkPath } from "../package.ts";

const isInstaller = is.LiteralOneOf(["npm", "pnpm", "yarn"]);
export type Installer = PredicateType<typeof isInstaller>;

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  dependencies: is.RecordOf(is.String, is.String),
  scripts: is.OptionalOf(is.RecordOf(is.String, is.String)),
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  installer: Installer,
  packageInfo: Package,
  rootDir: string,
) {
  const packagePath = getPackagePath(packageInfo, rootDir);
  await fs.ensureDir(packagePath);

  await makePackageJson(packageInfo, packagePath);
  await runInstall(installer, packagePath);
  if (packageInfo.scripts?.build) {
    await runBuild(installer, packagePath);
  }

  console.log(
    `Installed ${packageInfo.name} to ${getSymlinkPath(packageInfo, rootDir)}`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, packageInfo.binPath),
    getSymlinkPath(packageInfo, rootDir),
  );
}

async function runBuild(installer: Installer, packagePath: string) {
  const command = new Deno.Command(installer, {
    args: ["run", "build"],
    cwd: packagePath,
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to build package");
  }
}

async function runInstall(installer: Installer, packagePath: string) {
  const command = new Deno.Command(installer, {
    args: ["install"],
    cwd: packagePath,
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to install package");
  }
}

async function makePackageJson(info: Package, packagePath: string) {
  const json_path = path.join(packagePath, "package.json");
  await fs.ensureFile(json_path);
  await Deno.writeTextFile(
    json_path,
    JSON.stringify({
      name: `@sepia/${info.name}`,
      version: "0.0.0",
      dependencies: info.dependencies,
      scripts: info.scripts,
    }),
  );
}
