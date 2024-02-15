import { Denops } from "./deps.ts";

export async function notifyInfo(
  denops: Denops,
  message: string,
): Promise<void> {
  await denops.cmd(`call sepia#internal#notify_info("${message}")`);
}

export async function notifyWarn(
  denops: Denops,
  message: string,
): Promise<void> {
  await denops.cmd(`call sepia#internal#notify_warn("${message}")`);
}

export async function notifyError(
  denops: Denops,
  message: string,
): Promise<void> {
  await denops.cmd(`call sepia#internal#notify_error("${message}")`);
}
