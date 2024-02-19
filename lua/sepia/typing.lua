---@class sepia.Options
---@field public install_root_dir? string
---@field public npm_installer? "npm" | "pnpm" | "yarn"
---@field public max_concurrency? number
---@field public path_location? "prepend" | "append" | "skip"

---@alias sepia.PackageInfo sepia.BundlerPackageInfo | sepia.CompressedPackageInfo | sepia.NpmPackageInfo

---@class sepia.package.BasePackage
---@field public name string
---@field public binPath string

---@alias sepia.BundlerPackageInfo { type: "bundler", package: sepia.package.BundlerPackage }
---@class sepia.package.BundlerPackage : sepia.package.BasePackage
---@field public gems (string | string[])[]

---@alias sepia.CompressedPackageInfo { type: "compressed", package: sepia.package.CompressedPackage }
---@class sepia.package.CompressedPackage : sepia.package.BasePackage
---@field public url string

---@alias sepia.NpmPackageInfo { type: "npm", package: sepia.package.NpmPackage }
---@class sepia.package.NpmPackage : sepia.package.BasePackage
---@field public dependencies table<string, string>
---@field public scripts? table<string, string>
