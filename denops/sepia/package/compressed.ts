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

type CompressedType = "zip" | "tar" | "gz";

function getCompactedType(url: string): CompressedType | undefined {
  const regexs: Record<CompressedType, RegExp> = {
    tar: /\.tar(\.(gz|bz2|xz)|)$/,
    zip: /\.zip$/,
    gz: /\.gz$/,
  };
  for (const [type, regex] of Object.entries(regexs)) {
    if (regex.test(url)) {
      return type as CompressedType;
    }
  }
  return undefined;
}

export async function installPackage(
  pkg: Package,
  rootDir: string,
): Promise<void> {
  const packagePath = getPackagePath(pkg, rootDir);
  await fs.ensureDir(packagePath);

  const compType = getCompactedType(pkg.url);
  if (!compType) {
    throw new Error(`Unknown compressed type: ${pkg.url}`);
  }

  // NOTE: For tar files, we can use `package.tar` for all tar files because `tar -xvf` command automatically detects the compression type by the first few bytes of the file.
  const compFilePath = path.join(packagePath, `package.${compType}`);
  await downloadFile(pkg.url, compFilePath);

  switch (compType) {
    case "tar": {
      const contentDir = path.join(packagePath, "content");
      await tar_xvf(compFilePath, contentDir);
      await fs.ensureSymlink(
        path.join(contentDir, pkg.binPath),
        getSymlinkPath(pkg, rootDir),
      );
      break;
    }
    case "zip": {
      const contentDir = path.join(packagePath, "content");
      await unzip_od(compFilePath, contentDir);
      await fs.ensureSymlink(
        path.join(contentDir, pkg.binPath),
        getSymlinkPath(pkg, rootDir),
      );
      break;
    }
    case "gz": {
      const uncompressedPath = path.join(packagePath, "package");
      await gunzip(compFilePath, uncompressedPath);
      await fs.ensureSymlink(
        uncompressedPath,
        getSymlinkPath(pkg, rootDir),
      );
      break;
    }
    default: {
      const unexpected: never = compType;
      throw new Error(`Unexpected compressed type: ${unexpected}`);
    }
  }
}

async function tar_xvf(tarPath: string, dist: string): Promise<void> {
  await fs.ensureDir(dist);
  const command = new Deno.Command("tar", {
    args: ["-xvf", tarPath, "-C", dist],
    cwd: path.resolve(tarPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
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

async function unzip_od(zipPath: string, dist: string): Promise<void> {
  await fs.ensureDir(dist);
  const command = new Deno.Command("unzip", {
    args: ["-o", zipPath, "-d", dist],
    cwd: path.resolve(zipPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
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

async function gunzip(gzPath: string, dist: string): Promise<void> {
  const command = new Deno.Command("gunzip", {
    args: ["-c", gzPath],
    cwd: path.resolve(gzPath, "../"),
  });
  const { code, stdout, stderr } = await command.output();
  if (code === 0) {
    await fs.ensureFile(dist);
    await Deno.writeFile(dist, stdout, { mode: 0o755 }); // rwxr-xr-x
  } else {
    console.error(decodeText(stderr));
    throw new Error(
      `Failed to build package: ${
        JSON.stringify({
          code,
          stderr: decodeText(stderr),
        })
      }`,
    );
  }
}
