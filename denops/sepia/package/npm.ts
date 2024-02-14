import { fs, is, path, PredicateType } from "../deps.ts";
import { decode_text, get_package_path, get_symlink_path } from "../package.ts";

const isInstaller = is.LiteralOneOf(["npm", "pnpm", "yarn"]);
export type Installer = PredicateType<typeof isInstaller>;

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  dependencies: is.RecordOf(is.String, is.String),
  scripts: is.OptionalOf(is.RecordOf(is.String, is.String)),
});
export type Package = PredicateType<typeof isPackage>;

export async function install_package(
  installer: Installer,
  packageInfo: Package,
  rootDir: string,
) {
  const packagePath = get_package_path(packageInfo, rootDir);
  await fs.ensureDir(packagePath);

  await make_package_json(packageInfo, packagePath);
  await run_install(installer, packagePath);
  if (packageInfo.scripts?.build) {
    await run_build(installer, packagePath);
  }

  console.log(
    `Installed ${packageInfo.name} to ${
      get_symlink_path(packageInfo, rootDir)
    }`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, packageInfo.binPath),
    get_symlink_path(packageInfo, rootDir),
  );
}

async function run_build(installer: Installer, packagePath: string) {
  const command = new Deno.Command(installer, {
    args: ["run", "build"],
    cwd: packagePath,
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decode_text(stdout));
    console.error(decode_text(stderr));
    throw new Error("Failed to build package");
  }
}

async function run_install(installer: Installer, packagePath: string) {
  const command = new Deno.Command(installer, {
    args: ["install"],
    cwd: packagePath,
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decode_text(stdout));
    console.error(decode_text(stderr));
    throw new Error("Failed to install package");
  }
}

async function make_package_json(info: Package, packagePath: string) {
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
