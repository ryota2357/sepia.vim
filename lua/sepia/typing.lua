---@class sepia.Options
---@field public install_root_dir? string
---@field public npm_installer? "npm" | "pnpm" | "yarn"
---@field public max_concurrency? number
---@field public path_location? "prepend" | "append" | "skip"

---@alias sepia.PackageInfo sepia.CompressedPackageInfo | sepia.FilePackageInfo | sepia.GemPackageInfo | sepia.NpmPackageInfo

---@class sepia.package.BasePackage
---@field public name string

---@alias sepia.CompressedPackageInfo { type: "compressed", package: sepia.package.CompressedPackage }
---@class sepia.package.CompressedPackage : sepia.package.BasePackage
---@field public binPath string
---@field public url string
---
---@alias sepia.FilePackageInfo { type: "file", package: sepia.package.File }
---@class sepia.package.File : sepia.package.BasePackage
---@field public url string

---@alias sepia.GemPackageInfo { type: "gem", package: sepia.package.GemPackage }
---@class sepia.package.GemPackage : sepia.package.BasePackage
---@field public bin string?
---@field public version string

---@alias sepia.NpmPackageInfo { type: "npm", package: sepia.package.NpmPackage }
---@class sepia.package.NpmPackage : sepia.package.BasePackage
---@field public binPath string
---@field public dependencies table<string, string>
---@field public scripts? table<string, string>
