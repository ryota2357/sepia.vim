import { fs, is, path, PredicateType } from "../deps.ts";
import { decodeText } from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  gems: is.ArrayOf(is.UnionOf([is.String, is.TupleOf([is.String, is.String])])),
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  pkg: Package,
  cwd: string,
): Promise<string> {
  await makeGemfile(pkg, cwd);
  await runInstall(cwd);

  return path.join(cwd, pkg.binPath);
}

async function runInstall(cwd: string): Promise<void> {
  const command = new Deno.Command("bundle", {
    args: ["install"],
    cwd,
    env: { GEM_HOME: cwd },
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to install package");
  }
}

async function makeGemfile(pkg: Package, cwd: string): Promise<void> {
  const gemfilePath = path.join(cwd, "Gemfile");
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
