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

  if (/\.zip$/.test(packageInfo.url) === false) {
    throw new Error(
      `Invalid package url (must be a zip file extension): ${packageInfo.url}`,
    );
  }
  const zipFilePath = path.join(packagePath, "package.zip");
  await download_file(packageInfo.url, zipFilePath);
  await unzip(zipFilePath, path.join(packagePath, "content"));

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

async function unzip(zipPath: string, dist: string) {
  await fs.ensureDir(dist);
  const command = new Deno.Command("unzip", {
    args: ["-o", zipPath, "-d", dist],
    cwd: path.resolve(zipPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    console.log(decode_text(stdout));
    console.error(decode_text(stderr));
    throw new Error("Failed to build package");
  }
}
