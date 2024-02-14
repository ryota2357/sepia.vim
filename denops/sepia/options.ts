import { Denops, ensure, globals, is, PredicateType } from "./deps.ts";

// ref: https://zenn.dev/kazuwombat/articles/038963ca99854e
type SnakeToCamelCase<T extends string> = T extends `${infer R}_${infer U}`
  ? `${R}${Capitalize<SnakeToCamelCase<U>>}`
  : T;
type SnakeToCamel<T extends object> = {
  [K in keyof T as `${SnakeToCamelCase<string & K>}`]: T[K] extends object
    ? SnakeToCamel<T[K]>
    : T[K];
};

const isOptions = is.ObjectOf({
  install_root_dir: is.String,
  npm_installer: is.LiteralOneOf(["npm", "pnpm", "yarn"]),
  max_concurrency: is.Number,
  // path_location: is.LiteralOneOf(["prepend", "append", "skip"]),
});
export type Options = SnakeToCamel<PredicateType<typeof isOptions>>;

export async function getOptions(denops: Denops): Promise<Options> {
  const options = await globals.get(denops, "sepia#_options");
  const o = ensure(options, isOptions);
  return {
    installRootDir: o.install_root_dir,
    npmInstaller: o.npm_installer,
    maxConcurrency: o.max_concurrency,
    // pathLocation: o.path_location,
  };
}
