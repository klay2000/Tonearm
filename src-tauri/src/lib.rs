// MusicBrainz blocks plain browser User-Agents. The web app routes around this
// with an nginx proxy (see README), but the desktop app has no proxy to sit
// behind — so requests go through Rust, which isn't subject to the webview's
// header restrictions and can set the User-Agent MusicBrainz requires.
#[tauri::command]
async fn mb_fetch(path: String) -> Result<String, String> {
  let url = format!("https://musicbrainz.org/ws/2/{path}");
  let client = reqwest::Client::new();
  let res = client
    .get(&url)
    .header("User-Agent", "tonearm/0.1 (https://github.com/klay2000/subsonic-client)")
    .send()
    .await
    .map_err(|e| e.to_string())?;
  res.text().await.map_err(|e| e.to_string())
}

// The CPU arch and AppImage path the app is running as, so the frontend can
// pick a matching release asset. `appimage` is None outside an AppImage.
#[derive(serde::Serialize)]
struct UpdateTarget {
  arch: String,
  appimage: Option<String>,
}

#[tauri::command]
fn update_target() -> UpdateTarget {
  UpdateTarget {
    arch: std::env::consts::ARCH.to_string(),
    appimage: std::env::var("APPIMAGE").ok(),
  }
}

// Download a new AppImage from `url`, replace the running AppImage file with
// it, and relaunch. Only works when running as an AppImage (APPIMAGE is set).
#[tauri::command]
async fn install_update(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let appimage = std::env::var("APPIMAGE")
    .map_err(|_| "not running as an AppImage".to_string())?;
  let target = std::path::PathBuf::from(&appimage);
  let dir = target.parent().ok_or("could not resolve AppImage directory")?;

  let client = reqwest::Client::new();
  let bytes = client
    .get(&url)
    .header("User-Agent", "tonearm-updater")
    .send()
    .await
    .map_err(|e| e.to_string())?
    .error_for_status()
    .map_err(|e| e.to_string())?
    .bytes()
    .await
    .map_err(|e| e.to_string())?;

  // Write to a temp file in the same directory (so the final rename is atomic
  // and stays on one filesystem), make it executable, then swap it in.
  let tmp = dir.join(".tonearm-update.AppImage");
  std::fs::write(&tmp, &bytes).map_err(|e| e.to_string())?;
  #[cfg(unix)]
  {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = std::fs::metadata(&tmp).map_err(|e| e.to_string())?.permissions();
    perms.set_mode(0o755);
    std::fs::set_permissions(&tmp, perms).map_err(|e| e.to_string())?;
  }
  std::fs::rename(&tmp, &target).map_err(|e| e.to_string())?;

  // Re-exec the (now updated) binary. Does not return.
  app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![mb_fetch, update_target, install_update])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
