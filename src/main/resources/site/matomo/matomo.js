var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
  if (req.mode !== 'live') {
    return; // We don't need to tell our analytics about the things we do in Content Studio.
  }

  var siteConfig = portalLib.getSiteConfig();
  if (!siteConfig) {
    log.error("Failed to get site config in Matomo Analytics");
    return; // Something is wrong, so we stop.
  }
  var matomoUrl = portalLib.sanitizeHtml(siteConfig['matomoUrl'] || '');
  var matomoJavaScriptUrl = portalLib.sanitizeHtml(siteConfig['matomoJavaScriptUrl'] || '');
  var siteId = portalLib.sanitizeHtml(siteConfig['siteId'] || '1');
  var domainName = portalLib.sanitizeHtml(siteConfig['domainName'] || '');
  var matomoOptions = siteConfig.options || {};
  var trackSubdomains = matomoOptions['trackSubdomains'] || false;
  var insertDomainName = matomoOptions['insertDomainName'] || false;
  var hideAliasClicks = matomoOptions['hideAliasClicks'] || false;
  var enableTracking = matomoOptions['enableTracking'] || false;
  var trackingConsent = matomoOptions['trackingConsent'] || "cookieConsentRequired";
  var matomoTagManagerContainerId = '';
  if (siteConfig.matomoTagManager) {
    matomoTagManagerContainerId = portalLib.sanitizeHtml(siteConfig['matomoTagManager'].containerId || '');
  }

  if (
    !enableTracking ||
    !matomoUrl ||
    !matomoJavaScriptUrl ||
    !siteId ||
    typeof trackSubdomains !== "boolean" ||
    typeof insertDomainName !== "boolean" ||
    typeof hideAliasClicks !== "boolean" ||
    typeof enableTracking !== "boolean"
  ) {
    return; // App is not properly configured or tracking is disabled.
  }

  var snippet = '';

  // If Matomo Tag Manager isn't activated, we set up the Matomo tracker as normal
  if (!matomoTagManagerContainerId) {
    snippet += '/* Matomo */';
    snippet += 'var _paq = window._paq = window._paq || [];';
    snippet += '_paq.push(["setTrackerUrl", "' + matomoUrl + '/matomo.php"]);';
    snippet += '_paq.push(["setSiteId", "' + siteId + '"]);';

    if (trackSubdomains) {
      snippet += '_paq.push(["setDocumentTitle", document.domain + "/" + document.title]);';
    }
    if (hideAliasClicks) {
        snippet += '_paq.push(["setDomains", ["*.' + domainName + '"]]);';
    }
    if (insertDomainName) {
        snippet += '_paq.push(["setCookieDomain", "*.' + domainName + '"]);';
    }
    snippet += '_paq.push(["trackPageView"]);';
    snippet += '_paq.push(["enableLinkTracking"]);';
  }

  // If Matomo Tag Manager is activated, we don't need to set up the Matomo tracker manually
  if (matomoTagManagerContainerId) {
    snippet += '/* Matomo Tag Manager */;var _mtm = window._mtm = window._mtm || [];_mtm.push({"mtm.startTime": (new Date().getTime()), "event": "mtm.Start"});';
    snippet += 'var _paq = window._paq = window._paq || [];';
  }

  // The older version of the app would use "rememberCookieConsentGiven" so Matomo could create a "consent" cookie to keep track of consent status.
  // We're now fully relying on the Cookie Panel app (or any other cookie consent solution people might use) to keep track of consent status.
  // So we need to make sure that old cookie is deleted for any previous visitors that might still have it, to prevent it from interfering.
  snippet += '_paq.push(["forgetCookieConsentGiven"]);';

  if (trackingConsent === "cookieConsentRequired") {
    // "requireCookieConsent" will allow Matomo to track users, but not setting tracking cookies unless consent is given.
    snippet += '_paq.push(["requireCookieConsent"]);';

    // We're setting a function on the window object that can give consent, so the Cookie Panel app (or any other cookie consent solution) can call this function when needed.
    snippet += 'window.__RUN_ON_COOKIE_CONSENT__ = window.__RUN_ON_COOKIE_CONSENT__ || {};';
    snippet += 'window.__RUN_ON_COOKIE_CONSENT__["no-bouvet-app-matomo_disabled"] = function () {window._paq.push(["setCookieConsentGiven"])};';
  }

  if (trackingConsent === "trackingConsentRequired") {
    // "requireConsent" will not allow Matomo to track and process any data unless consent is given.
    snippet += '_paq.push(["requireConsent"]);';

    snippet += 'window.__RUN_ON_COOKIE_CONSENT__ = window.__RUN_ON_COOKIE_CONSENT__ || {};';
    snippet += 'window.__RUN_ON_COOKIE_CONSENT__["no-bouvet-app-matomo_disabled"] = function () {window._paq.push(["setConsentGiven"])};';
  }

  return {
      headers: {
        "Cache-Control": "no-cache, must-revalidate" // As the script can change depending on the Matomo siteconfig, we can't cache it.
      },
      contentType: 'application/javascript; charset=utf-8',
      body: snippet
  };
}
