import { fs, is, path, PredicateType } from "../deps.ts";
import {
  decode_text,
  download_file,
  get_package_path,
  get_symlink_path,
} from "../package.ts";

export const isPackage = is.ObjectOf({
  name: is.String,
  binPath: is.String,
  url: is.String,
});
export type Package = PredicateType<typeof isPackage>;

export async function install_package(
  packageInfo: Package,
  rootDir: string,
) {
  const packagePath = get_package_path(packageInfo, rootDir);
  await fs.ensureDir(packagePath);

  // Check if the package url is a tar file.
  // NOTE: `tar -xvf` command automatically detects the compression type by the first few bytes of the file.
  //       So, we can use *.tar for all tar files.
  if (/\.tar(\.(gz|bz2|xz)|)$/.test(packageInfo.url) === false) {
    throw new Error(
      `Invalid package url (must be a tar file extension): ${packageInfo.url}`,
    );
  }
  const tarFilePath = path.join(packagePath, "package.tar");
  await download_file(packageInfo.url, tarFilePath);
  await tar_xvf(tarFilePath, path.join(packagePath, "content"));

  console.log(
    `Installed ${packageInfo.name} to ${
      get_symlink_path(packageInfo, rootDir)
    }`,
  );
  await fs.ensureSymlink(
    path.join(packagePath, "content", packageInfo.binPath),
    get_symlink_path(packageInfo, rootDir),
  );
}

async function tar_xvf(tarPath: string, dist: string) {
  await fs.ensureDir(dist);
  const command = new Deno.Command("tar", {
    args: ["-xvf", tarPath, "-C", dist],
    cwd: path.resolve(tarPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decode_text(stdout));
    console.error(decode_text(stderr));
    throw new Error("Failed to build package");
  }
}
