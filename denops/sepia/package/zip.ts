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
  packageInfo: Package,
  rootDir: string,
) {
  const packagePath = getPackagePath(packageInfo, rootDir);
  await fs.ensureDir(packagePath);

  if (/\.zip$/.test(packageInfo.url) === false) {
    throw new Error(
      `Invalid package url (must be a zip file extension): ${packageInfo.url}`,
    );
  }
  const zipFilePath = path.join(packagePath, "package.zip");
  await downloadFile(packageInfo.url, zipFilePath);
  await unzip_od(zipFilePath, path.join(packagePath, "content"));

  console.log(
    `Installed ${packageInfo.name} to ${getSymlinkPath(packageInfo, rootDir)}`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, packageInfo.binPath),
    getSymlinkPath(packageInfo, rootDir),
  );
}

async function unzip_od(zipPath: string, dist: string) {
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
