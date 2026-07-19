/*
 * Tatar — браузер хоорондын API shim.
 * Chrome / Edge нь `chrome.*` (MV3-д promise суурьтай), Firefox нь `browser.*`
 * ашигладаг. Бид хоёуланг нь `browserAPI` болгон нэгтгэнэ.
 */
(function () {
  var api =
    typeof browser !== "undefined" && browser && browser.runtime
      ? browser
      : chrome;
  if (typeof globalThis !== "undefined") globalThis.browserAPI = api;
  else if (typeof self !== "undefined") self.browserAPI = api;
  else if (typeof window !== "undefined") window.browserAPI = api;
})();
