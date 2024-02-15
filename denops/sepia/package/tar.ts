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

  // Check if the package url is a tar file.
  // NOTE: `tar -xvf` command automatically detects the compression type by the first few bytes of the file.
  //       So, we can use *.tar for all tar files.
  if (/\.tar(\.(gz|bz2|xz)|)$/.test(pkg.url) === false) {
    throw new Error(
      `Invalid package url (must be a tar file extension): ${pkg.url}`,
    );
  }
  const tarFilePath = path.join(packagePath, "package.tar");
  await downloadFile(pkg.url, tarFilePath);
  await tar_xvf(tarFilePath, path.join(packagePath, "content"));

  await fs.ensureSymlink(
    path.join(packagePath, "content", pkg.binPath),
    getSymlinkPath(pkg, rootDir),
  );
}

async function tar_xvf(tarPath: string, dist: string): Promise<void> {
  await fs.ensureDir(dist);
  const command = new Deno.Command("tar", {
    args: ["-xvf", tarPath, "-C", dist],
    cwd: path.resolve(tarPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decodeText(stdout));
    console.error(decodeText(stderr));
    throw new Error("Failed to build package");
  }
}
