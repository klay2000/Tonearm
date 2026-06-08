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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![mb_fetch])
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
