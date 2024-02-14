---@class sepia.Options
---@field public install_root_dir? string
---@field public npm_installer? "npm" | "pnpm" | "yarn"
---@field public max_concurrency? number
---@field public path_location? "prepend" | "append" | "skip"

---@alias sepia.PackageInfo sepia.NpmPackageInfo | sepia.ZipPackageInfo | sepia.TarPackageInfo

---@class sepia.package.BasePackage
---@field public name string
---@field public binPath string

---@alias sepia.NpmPackageInfo { type: "npm", package: sepia.package.NpmPackage }
---@class sepia.package.NpmPackage : sepia.package.BasePackage
---@field public dependencies table<string, string>
---@field public scripts? table<string, string>

---@alias sepia.TarPackageInfo { type: "tar", package: sepia.package.TarPackage }
---@class sepia.package.TarPackage : sepia.package.BasePackage
---@field public url string

---@alias sepia.ZipPackageInfo { type: "zip", package: sepia.package.ZipPackage }
---@class sepia.package.ZipPackage : sepia.package.BasePackage
---@field public url string
