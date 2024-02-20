import { fs, is, path, PredicateType } from "../deps.ts";
import { decodeText } from "../package.ts";

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
  pkg: Package,
  cwd: string,
  installer: Installer,
): Promise<string> {
  await makePackageJson(pkg, cwd);
  await runInstall(installer, cwd);
  if (pkg.scripts?.build) {
    await runBuild(installer, cwd);
  }
  return path.join(cwd, pkg.binPath);
}

async function runBuild(installer: Installer, cwd: string): Promise<void> {
  const command = new Deno.Command(installer, { args: ["run", "build"], cwd });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to build package");
  }
}

async function runInstall(installer: Installer, cwd: string): Promise<void> {
  const command = new Deno.Command(installer, { args: ["install"], cwd });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to install package");
  }
}

async function makePackageJson(pkg: Package, cwd: string): Promise<void> {
  const jsonPath = path.join(cwd, "package.json");
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
