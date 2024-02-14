function! sepia#internal#install(pkg_infos) abort
  call s:notify('install', [a:pkg_infos])
endfunction

function! sepia#internal#uninstall(pkg_infos) abort
  call s:notify('uninstall', [a:pkg_infos])
endfunction

function! s:notify(method, args) abort
  call denops#plugin#wait_async('sepia', { -> denops#notify('sepia', a:method, a:args) })
endfunction
