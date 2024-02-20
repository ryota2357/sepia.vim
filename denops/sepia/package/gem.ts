import { is, path, PredicateType } from "../deps.ts";
import { createBinWrapper, decodeText } from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  bin: is.OptionalOf(is.String),
  version: is.String,
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  pkg: Package,
  cwd: string,
): Promise<string> {
  if (!pkg.bin) {
    pkg.bin = pkg.name;
  }
  await runInstall(cwd, pkg);
  return createBinWrapper(cwd, path.join(cwd, "bin", pkg.bin), [
    "#!/usr/bin/env bash",
    `export GEM_HOME=${cwd}`,
  ]);
}

async function runInstall(packagePath: string, pkg: Package): Promise<void> {
  const command = new Deno.Command("gem", {
    args: [
      "install",
      "--no-user-install",
      "--no-format-executable",
      "--install-dir=.",
      "--bindir=bin",
      "--no-document",
      `${pkg.bin}:${pkg.version}`,
    ],
    cwd: packagePath,
    env: { GEM_HOME: packagePath },
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.error(decodeText(stderr));
    throw new Error(
      `Failed to build package: ${
        JSON.stringify({
          code,
          stdout: decodeText(stdout),
          stderr: decodeText(stderr),
        })
      }`,
    );
  }
}
