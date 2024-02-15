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
  pkg: Package,
  rootDir: string,
): Promise<void> {
  const packagePath = getPackagePath(pkg, rootDir);
  await fs.ensureDir(packagePath);

  await makePackageJson(pkg, packagePath);
  await runInstall(installer, packagePath);
  if (pkg.scripts?.build) {
    await runBuild(installer, packagePath);
  }

  console.log(
    `Installed ${pkg.name} to ${getSymlinkPath(pkg, rootDir)}`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, pkg.binPath),
    getSymlinkPath(pkg, rootDir),
  );
}

async function runBuild(
  installer: Installer,
  packagePath: string,
): Promise<void> {
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

async function runInstall(
  installer: Installer,
  packagePath: string,
): Promise<void> {
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

async function makePackageJson(
  pkg: Package,
  packagePath: string,
): Promise<void> {
  const jsonPath = path.join(packagePath, "package.json");
  await fs.ensureFile(jsonPath);
  await Deno.writeTextFile(
    jsonPath,
    JSON.stringify({
      name: `@sepia/${pkg.name}`,
      version: "0.0.0",
      dependencies: pkg.dependencies,
      scripts: pkg.scripts,
    }),
  );
}
