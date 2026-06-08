// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // VMs and other virtual/remote displays often lack a working DRM/KMS GPU
  // path, leaving WebKitGTK's compositor a blank window with
  // "DRM_IOCTL_MODE_CREATE_DUMB ... Permission denied" in the log. Forcing
  // software rendering up front — before the webview initializes — makes the
  // app render everywhere, at a negligible cost for a UI this simple.
  std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
  std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
  std::env::set_var("LIBGL_ALWAYS_SOFTWARE", "1");

  // The AppImage bundles its own GLib, which can be a different version than
  // the host's gvfs GIO modules — loading them then fails with "undefined
  // symbol: g_variant_builder_init_static" (and similar). Tonearm has no need
  // for gvfs (trash, network mounts, …), so skip it and use the local VFS.
  std::env::set_var("GIO_USE_VFS", "local");

  app_lib::run();
}
