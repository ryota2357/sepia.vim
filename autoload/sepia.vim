function! sepia#setup(options = {}) abort
  if !exists('g:sepia#_options')
    let g:sepia#_options = #{
      \   install_root_dir: has('nvim') ? stdpath('data') . '/sepia' : fnamemodify('~/.local/share/vim/sepia', ':p'),
      \   npm_installer: "npm",
      \   max_concurrency: 4,
      \   path_location: "prepend",
      \ }
  endif

  for k in keys(a:options)
    if !has_key(g:sepia#_options, k)
      echoerr '[sepia] Option ' .. k .. ' is not supported'
    endif
    let g:sepia#_options[k] = a:options[k]
  endfor

  if !exists('g:sepia#_set_path') | call s:set_PATH() | endif
  let g:sepia#_set_path = 1
endfunction

function! sepia#register(...) abort
  if !exists("g:sepia#_all_package_info")
    let g:sepia#_all_package_info = {}
  endif
  for pkg_info in a:000
    let l:name = pkg_info.package.name
    if has_key(g:sepia#_all_package_info, l:name)
      echoerr '[sepia] Package ' .. l:name .. 'is already registered so it will be overwritten'
    endif
    let g:sepia#_all_package_info[l:name] = pkg_info
  endfor
endfunction

function! sepia#install(name) abort
  let l:pkg_info = s:get_package_info(a:name)
  if l:pkg_info !=# {}
    call sepia#internal#install([l:pkg_info])
  endif
endfunction

function! sepia#install_all() abort
  call sepia#internal#install(values(g:sepia#_all_package_info))
endfunction

function! sepia#uninstall(name) abort
  let l:pkg_info = s:get_package_info(a:name)
  if l:pkg_info !=# {}
    call sepia#internal#uninstall([l:pkg_info])
  endif
endfunction

function! sepia#uninstall_all() abort
  call sepia#internal#uninstall(values(g:sepia#_all_package_info))
endfunction

function! s:get_package_info(name) abort
  let l:pkg_info = get(g:sepia#_all_package_info, a:name, {})
  if l:pkg_info ==# {}
    echoerr '[sepia] Package ' .. a:name .. 'is not registered'
  endif
  return l:pkg_info
endfunction

function! s:set_PATH() abort
  let l:path_location = g:sepia#_options.path_location
  let l:bin_path = expand(g:sepia#_options.install_root_dir .. "/bin")
  if l:path_location ==# 'prepend'
    let $PATH = l:bin_path . ':' . $PATH
  elseif l:path_location ==# 'append'
    let $PATH = $PATH . ':' . l:bin_path
  elseif l:path_location ==# 'skip'
  else
    echoerr '[sepia] Option path_location must be one of prepend, append, or skip'
  endif
endfunction
