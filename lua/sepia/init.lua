local M = {}

---@param options sepia.Options
---@return nil
function M.setup(options)
    vim.validate({
        install_root_dir = { options.install_root_dir, "string", true },
        npm_installer = {
            options.npm_installer,
            function(installer)
                return (not installer) or installer == "npm" or installer == "pnpm" or installer == "yarn"
            end,
            [["npm" | "pnpm" | "yarn"]]
        },
        max_concurrency = {
            options.max_concurrency,
            function(v)
                return (not v) or (type(v) == "number" and v > 0)
            end,
            "greater than 0 number"
        },
        path_location = {
            options.path_location,
            function(v)
                return (not v) or v == "prepend" or v == "append" or v == "skip"
            end,
            [["prepend" | "append" | "skip"]]
        }
    })
    vim.fn["sepia#setup"](options)
end

---@param ... sepia.PackageInfo
---@return nil
function M.register(...)
    for _, info in ipairs({ ... }) do
        if info.type == "compressed" then
            vim.validate({
                ["package"] = { info.package, "table" },
                ["package.name"] = { info.package.name, "string" },
                ["package.binPath"] = { info.package.binPath, "string" },
                ["package.url"] = { info.package.url, "string" }
            })
        elseif info.type == "gem" then
            vim.validate({
                ["package"] = { info.package, "table" },
                ["package.name"] = { info.package.name, "string" },
                ["package.bin"] = { info.package.bin, "string", true },
                ["package.version"] = { info.package.version, "string" }
            })
        elseif info.type == "npm" then
            vim.validate({
                ["package"] = { info.package, "table" },
                ["package.name"] = { info.package.name, "string" },
                ["package.binPath"] = { info.package.binPath, "string" },
                ["package.dependencies"] = { info.package.dependencies, "table" },
                ["package.scripts"] = { info.package.scripts, "table", true }
            })
        else
            error("Invalid package type: " .. info.type)
        end
    end
    vim.fn["sepia#register"](...)
end

---@param name string
---@return nil
function M.install(name)
    vim.validate({ name = { name, "string" } })
    vim.fn["sepia#install"](name)
end

---@return nil
function M.install_all()
    vim.fn["sepia#install_all"]()
end

---@param name string
---@return nil
function M.uninstall(name)
    vim.validate({ name = { name, "string" } })
    vim.fn["sepia#uninstall"](name)
end

---@return nil
function M.uninstall_all()
    vim.fn["sepia#uninstall_all"]()
end

return M
