var contentLib = require('/lib/xp/content');
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
  log.info(JSON.stringify(siteConfig, null, 2));
  var matomoUrl = portalLib.sanitizeHtml(siteConfig['matomoUrl'] || '');
  var matomoJavaScriptUrl = portalLib.sanitizeHtml(siteConfig['matomoJavaScriptUrl'] || '');
  var siteId = portalLib.sanitizeHtml(siteConfig['siteId'] || '1');
  var domainName = portalLib.sanitizeHtml(siteConfig['domainName'] || '');
  var matomoOptions = siteConfig.options || {};
  var trackSubdomains = matomoOptions['trackSubdomains'] || false;
  var insertDomainName = matomoOptions['insertDomainName'] || false; 
  var hideAliasClicks = matomoOptions['hideAliasClicks'] || false;
  var enableTracking = matomoOptions['enableTracking'] || false;
  var disableCookies = matomoOptions['disableCookies'] || false;
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
    typeof enableTracking !== "boolean" ||
    typeof disableCookies !== "boolean"
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
    if (req.cookies["no-bouvet-app-matomo_disabled"]) { // If this cookie is present, the Cookie Panel app is installed.
      snippet += '_paq.push(["requireCookieConsent"]);'; // We don't set cookies without user consent.
      if (req.cookies["no-bouvet-app-matomo_disabled"] === "true") { // User has not given consent.
        snippet += '_paq.push(["forgetCookieConsentGiven"]);'; // User may have revoked consent. We shall remember this.
  
        /* This will allow the Cookie Panel app to tell us when the User has consented to storing tracking cookies */
        snippet += 'window.__RUN_ON_COOKIE_CONSENT__ = window.__RUN_ON_COOKIE_CONSENT__ || {};';
        snippet += 'window.__RUN_ON_COOKIE_CONSENT__["no-bouvet-app-matomo_disabled"] = function () {window._paq.push(["rememberCookieConsentGiven"])};';
      }
    } else if (disableCookies) {
      snippet += '_paq.push(["requireCookieConsent"]);'; // We don't set cookies without user consent.
    }
  }

  // If Matomo Tag Manager is activated, we don't need to set up the Matomo tracker manually
  if (matomoTagManagerContainerId) {
    snippet += '/* Matomo Tag Manager */;var _mtm = window._mtm = window._mtm || [];_mtm.push({"mtm.startTime": (new Date().getTime()), "event": "mtm.Start"});';
    if (req.cookies["no-bouvet-app-matomo_disabled"]) { // If this cookie is present, the Cookie Panel app is installed.
      snippet += 'window._paq=window._paq||[];_paq.push(["requireCookieConsent"]);'; // We don't set cookies without user consent.
      if (req.cookies["no-bouvet-app-matomo_disabled"] === "true") { // User has not given consent.
        snippet += 'window._paq=window._paq||[];_paq.push(["forgetCookieConsentGiven"]);'; // User may have revoked consent. We shall remember this.
  
        /* This will allow the Cookie Panel app to tell us when the User has consented to storing tracking cookies */
        snippet += 'window.__RUN_ON_COOKIE_CONSENT__ = window.__RUN_ON_COOKIE_CONSENT__ || {};';
        snippet += 'window.__RUN_ON_COOKIE_CONSENT__["no-bouvet-app-matomo_disabled"] = function () {window._paq.push(["rememberCookieConsentGiven"]);};';
      }
    }
  }

  return {
      contentType: 'application/javascript; charset=utf-8',
      body: snippet
  };
}
