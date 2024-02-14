import { fs, is, path, PredicateType } from "./deps.ts";
import { Options } from "./options.ts";

import * as npm from "./package/npm.ts";
import * as tar from "./package/tar.ts";
import * as zip from "./package/zip.ts";

export const isPackageInfo = is.UnionOf([
  is.ObjectOf({
    type: is.LiteralOf("npm"),
    package: npm.isPackage,
  }),
  is.ObjectOf({
    type: is.LiteralOf("tar"),
    package: tar.isPackage,
  }),
  is.ObjectOf({
    type: is.LiteralOf("zip"),
    package: zip.isPackage,
  }),
]);
export type PackageInfo = PredicateType<typeof isPackageInfo>;

export function get_package_path(
  info: PackageInfo["package"],
  rootDir: string,
) {
  return path.join(rootDir, "packages", info.name);
}

export function get_symlink_path(
  info: PackageInfo["package"],
  rootDir: string,
) {
  return path.join(rootDir, "bin", info.name);
}

const textDecoder = new TextDecoder();
export function decode_text(text: Uint8Array) {
  return textDecoder.decode(text);
}

export async function download_file(url: string, dest: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }
  const content = new Uint8Array(await response.arrayBuffer());
  await fs.ensureFile(dest);
  await Deno.writeFile(dest, content);
}

export async function install_package(
  packageInfo: PackageInfo,
  options: Options,
) {
  const { type, package: pkg } = packageInfo;
  switch (type) {
    case "npm": {
      await npm.install_package(
        options.npmInstaller,
        packageInfo.package,
        options.installRootDir,
      );
      return;
    }
    case "tar": {
      await tar.install_package(pkg, options.installRootDir);
      return;
    }
    case "zip": {
      await zip.install_package(pkg, options.installRootDir);
      return;
    }
    default: {
      const unknownType: never = type;
      throw new Error(`Unknown package type: ${unknownType}`);
    }
  }
}

export async function uninstall_package(
  packageInfo: PackageInfo,
  options: Options,
) {
  const { type, package: pkg } = packageInfo;
  switch (type) {
    case "npm":
    case "tar":
    case "zip": {
      const remove_package_dir = (async () => {
        const packagePath = get_package_path(pkg, options.installRootDir);
        try {
          await Deno.remove(packagePath, { recursive: true });
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e;
          }
        }
      })();
      const remove_symlink = (async () => {
        const linkPath = get_symlink_path(pkg, options.installRootDir);
        try {
          await Deno.remove(linkPath);
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e;
          }
        }
      })();
      await Promise.all([remove_package_dir, remove_symlink]);
      return;
    }
    default: {
      const unknownType: never = type;
      throw new Error(`Unknown package type: ${unknownType}`);
    }
  }
}