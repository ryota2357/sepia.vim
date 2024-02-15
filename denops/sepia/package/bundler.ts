import { fs, is, path, PredicateType } from "../deps.ts";
import { decodeText, getPackagePath, getSymlinkPath } from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  gems: is.ArrayOf(is.UnionOf([is.String, is.TupleOf([is.String, is.String])])),
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  pkg: Package,
  rootDir: string,
): Promise<void> {
  const packagePath = getPackagePath(pkg, rootDir);
  await fs.ensureDir(packagePath);

  await makeGemfile(pkg, packagePath);
  await runInstall(packagePath);

  console.log(
    `Installed ${pkg.name} to ${getPackagePath(pkg, rootDir)}`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, pkg.binPath),
    getSymlinkPath(pkg, rootDir),
  );
}

async function runInstall(packagePath: string): Promise<void> {
  const command = new Deno.Command("bundle", {
    args: ["install"],
    cwd: packagePath,
    env: { GEM_HOME: packagePath },
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to install package");
  }
}

async function makeGemfile(pkg: Package, packagePath: string): Promise<void> {
  const gemfilePath = path.join(packagePath, "Gemfile");
  await fs.ensureFile(gemfilePath);
  await Deno.writeTextFile(
    gemfilePath,
    [
      "# frozen_string_literal: true",
      "source 'https://rubygems.org'",
      ...pkg.gems.map((gem) => {
        if (is.String(gem)) {
          return `gem '${gem}'`;
        } else {
          const [name, version] = gem;
          return `gem '${name}', '${version}'`;
        }
      }),
    ].join("\n"),
  );
}
