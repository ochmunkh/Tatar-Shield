/* Tatar Shield — background: icon-ны өнгө (файлаас ImageData болгож ачаална) + badge + үр дүн. */
try { importScripts("/src/lib/browser-polyfill.js"); }
catch (e) { console.error("Tatar importScripts failed", e); }

// Төлөв бүрийн icon файлууд. Path-аар setIcon хийвэл MV3 SW дээр "Failed to fetch"
// гардаг тул файлыг өөрсдөө fetch + createImageBitmap-аар ImageData болгож тавина.
var ICONFILES = {
  def:   { 16: "icons/icon16.png",        48: "icons/icon48.png",        128: "icons/icon128.png" },
  green: { 16: "icons/icon-green-16.png",  48: "icons/icon-green-48.png",  128: "icons/icon-green-128.png" },
  amber: { 16: "icons/icon-amber-16.png",  48: "icons/icon-amber-48.png",  128: "icons/icon-amber-128.png" },
  red:   { 16: "icons/icon-red-16.png",    48: "icons/icon-red-48.png",    128: "icons/icon-red-128.png" }
};
var _iconCache = {};

async function loadIcon(key) {
  if (_iconCache[key]) return _iconCache[key];
  var files = ICONFILES[key] || ICONFILES.def, out = {};
  var sizes = Object.keys(files);
  for (var i = 0; i < sizes.length; i++) {
    var s = sizes[i];
    try {
      var url = browserAPI.runtime.getURL(files[s]);
      var resp = await fetch(url);
      var blob = await resp.blob();
      var bmp = await createImageBitmap(blob);
      var c = new OffscreenCanvas(Number(s), Number(s));
      var x = c.getContext("2d");
      x.drawImage(bmp, 0, 0, Number(s), Number(s));
      out[s] = x.getImageData(0, 0, Number(s), Number(s));
    } catch (e) {}
  }
  _iconCache[key] = out;
  return out;
}

function setIcon(tabId, key) {
  loadIcon(key).then(function (data) {
    if (!data || Object.keys(data).length === 0) return;
    try {
      var p = browserAPI.action.setIcon({ tabId: tabId, imageData: data });
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }).catch(function () {});
}

function applyState(tabId, res) {
  var text = "", color = "#16a34a", icon = "def";
  if (res.official) { text = "✓"; color = "#16a34a"; icon = "green"; }
  else if (res.level === "high") { text = "!"; color = "#dc2626"; icon = "red"; }
  else if (res.level === "suspicious") { text = "?"; color = "#f59e0b"; icon = "amber"; }
  else { text = ""; icon = "def"; }
  try {
    var p1 = browserAPI.action.setBadgeText({ tabId: tabId, text: text });
    if (p1 && p1.catch) p1.catch(function () {});
    var p2 = browserAPI.action.setBadgeBackgroundColor({ tabId: tabId, color: color });
    if (p2 && p2.catch) p2.catch(function () {});
  } catch (e) {}
  setIcon(tabId, icon);
}

browserAPI.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg) return;
  if (msg.type === "safebrowse_result" && sender && sender.tab) {
    applyState(sender.tab.id, msg.result);
    try { browserAPI.storage.session.set({ ["sb_" + sender.tab.id]: msg.result }); } catch (e) {}
    return;
  }
  if (msg.type === "get_safebrowse") {
    browserAPI.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      var id = tabs[0] && tabs[0].id;
      if (id == null) { sendResponse(null); return; }
      browserAPI.storage.session.get("sb_" + id).then(function (o) {
        sendResponse(o["sb_" + id] || null);
      }).catch(function () { sendResponse(null); });
    }).catch(function () { sendResponse(null); });
    return true;
  }
});
