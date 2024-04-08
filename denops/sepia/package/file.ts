import { fs, is, path, PredicateType } from "../deps.ts";
import { downloadFile } from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  url: is.String,
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  pkg: Package,
  cwd: string,
): Promise<string> {
  await fs.ensureDir(cwd);

  const compFilePath = path.join(cwd, "package");
  await downloadFile(pkg.url, compFilePath);
  await Deno.chmod(compFilePath, 0x755); // rwxr-xr-x
  return compFilePath;
}
