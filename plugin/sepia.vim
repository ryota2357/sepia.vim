if exists('g:loaded_sepia')
  finish
endif
let s:save_cpo = &cpo
set cpo&vim

if has('nvim')
  let s:install_root_dir = stdpath('data') .. '/sepia'
else
  let s:install_root_dir = fnamemodify('~/.local/share/vim/sepia', ':p')
endif
let g:sepia#_options = #{
  \   install_root_dir: s:install_root_dir,
  \   npm_installer: "npm",
  \   max_concurrency: 4,
  \   path_location: "prepend",
  \ }

let g:sepia#_all_package_info = {}

let &cpo = s:save_cpo
unlet s:save_cpo
let g:loaded_sepia = 1
