import { fs, is, path, PredicateType } from "./deps.ts";
import { Options } from "./options.ts";

import * as bundler from "./package/bundler.ts";
import * as npm from "./package/npm.ts";
import * as compressed from "./package/compressed.ts";

export const isPackageInfo = is.UnionOf([
  is.ObjectOf({
    type: is.LiteralOf("bundler"),
    package: bundler.isPackage,
  }),
  is.ObjectOf({
    type: is.LiteralOf("npm"),
    package: npm.isPackage,
  }),
  is.ObjectOf({
    type: is.LiteralOf("compressed"),
    package: compressed.isPackage,
  }),
]);
export type PackageInfo = PredicateType<typeof isPackageInfo>;

const textDecoder = new TextDecoder();
export function decodeText(text: Uint8Array): string {
  return textDecoder.decode(text);
}

export async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }
  const content = new Uint8Array(await response.arrayBuffer());
  await fs.ensureFile(dest);
  await Deno.writeFile(dest, content);
}

export async function installPackage(
  packageInfo: PackageInfo,
  options: Options,
): Promise<void> {
  const { type, package: pkg } = packageInfo;

  const packagePath = getPackagePath(pkg, options.installRootDir);
  await fs.ensureDir(packagePath);

  const linkPath = await (async () => {
    switch (type) {
      case "bundler": {
        return await bundler.installPackage(pkg, options.installRootDir);
      }
      case "compressed": {
        return await compressed.installPackage(pkg, packagePath);
      }
      case "npm": {
        return await npm.installPackage(
          pkg,
          packagePath,
          options.npmInstaller,
        );
      }
      default: {
        const unknownType: never = type;
        throw new Error(`Unknown package type: ${unknownType}`);
      }
    }
  })();

  await fs.ensureSymlink(linkPath, getSymlinkPath(pkg, options.installRootDir));
}

export async function uninstallPackage(
  packageInfo: PackageInfo,
  options: Options,
): Promise<void> {
  const { type, package: pkg } = packageInfo;
  switch (type) {
    case "bundler":
    case "compressed":
    case "npm": {
      const remove_package_dir = (async () => {
        const packagePath = getPackagePath(pkg, options.installRootDir);
        try {
          await Deno.remove(packagePath, { recursive: true });
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e;
          }
        }
      })();
      const remove_symlink = (async () => {
        const linkPath = getSymlinkPath(pkg, options.installRootDir);
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

function getPackagePath(
  pkg: PackageInfo["package"],
  rootDir: string,
): string {
  return path.join(rootDir, "packages", pkg.name);
}

function getSymlinkPath(
  info: PackageInfo["package"],
  rootDir: string,
): string {
  return path.join(rootDir, "bin", info.name);
}
