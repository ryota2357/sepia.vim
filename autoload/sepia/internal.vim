function! sepia#internal#install(pkg_infos) abort
  call s:denops_notify('install', [a:pkg_infos])
endfunction

function! sepia#internal#uninstall(pkg_infos) abort
  call s:denops_notify('uninstall', [a:pkg_infos])
endfunction

if has('nvim')
  function! sepia#internal#notify_info(msg) abort
    call luaeval('vim.notify(_A.msg, vim.log.levels.INFO, { title = "sepia" })', #{ msg: a:msg })
  endfunction
  function! sepia#internal#notify_warn(msg) abort
    call luaeval('vim.notify(_A.msg, vim.log.levels.WARN, { title = "sepia" })', #{ msg: a:msg })
  endfunction
  function! sepia#internal#notify_error(msg) abort
    call luaeval('vim.notify(_A.msg, vim.log.levels.ERROR, { title = "sepia" })', #{ msg: a:msg })
  endfunction
else
  function! sepia#internal#notify_info(msg) abort
    echomsg a:msg
  endfunction
  function! sepia#internal#notify_warn(msg) abort
    echohl WarningMsg
    echomsg '[sepia] ' .. a:msg
    echohl None
  endfunction
  function! sepia#internal#notify_error(msg) abort
    echohl ErrorMsg
    echomsg '[sepia] ' .. a:msg
    echohl None
  endfunction
endif

function! s:denops_notify(method, args) abort
  call denops#plugin#wait_async('sepia', { -> denops#notify('sepia', a:method, a:args) })
endfunction
