import { type Denops, ensure, is, PromisePool } from "./deps.ts";
import { installPackage, isPackageInfo, uninstallPackage } from "./package.ts";
import { getOptions } from "./options.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    async install(u_packageInfos: unknown): Promise<void> {
      const packageInfos = ensure(u_packageInfos, is.ArrayOf(isPackageInfo));
      const options = await getOptions(denops);

      await PromisePool
        .withConcurrency(options.maxConcurrency)
        .for(packageInfos)
        .process(async (info) => await installPackage(info, options));
    },

    async uninstall(u_packageInfos: unknown): Promise<void> {
      const packageInfos = ensure(u_packageInfos, is.ArrayOf(isPackageInfo));
      const options = await getOptions(denops);

      await PromisePool
        .withConcurrency(options.maxConcurrency)
        .for(packageInfos)
        .process(async (info) => await uninstallPackage(info, options));
    },
  };
}
