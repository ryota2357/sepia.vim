import { fs, is, path, PredicateType } from "../deps.ts";
import {
  decodeText,
  downloadFile,
  getPackagePath,
  getSymlinkPath,
} from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  url: is.String,
});
export type Package = PredicateType<typeof isPackage>;

export async function installPackage(
  pkg: Package,
  rootDir: string,
): Promise<void> {
  const packagePath = getPackagePath(pkg, rootDir);
  await fs.ensureDir(packagePath);

  if (/\.zip$/.test(pkg.url) === false) {
    throw new Error(
      `Invalid package url (must be a zip file extension): ${pkg.url}`,
    );
  }
  const zipFilePath = path.join(packagePath, "package.zip");
  await downloadFile(pkg.url, zipFilePath);
  await unzip_od(zipFilePath, path.join(packagePath, "content"));

  await fs.ensureSymlink(
    path.join(packagePath, pkg.binPath),
    getSymlinkPath(pkg, rootDir),
  );
}

async function unzip_od(zipPath: string, dist: string): Promise<void> {
  await fs.ensureDir(dist);
  const command = new Deno.Command("unzip", {
    args: ["-o", zipPath, "-d", dist],
    cwd: path.resolve(zipPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to build package");
  }
}
