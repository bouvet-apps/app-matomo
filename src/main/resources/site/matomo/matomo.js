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

  var matomoUrl = portalLib.sanitizeHtml(siteConfig['matomoUrl'] || '');
  var siteId = portalLib.sanitizeHtml(siteConfig['siteId'] || '1');
  var domainName = portalLib.sanitizeHtml(siteConfig['domainName'] || '');
  var trackSubdomains = siteConfig['trackSubdomains'] || false;
  var insertDomainName = siteConfig['insertDomainName'] || false; 
  var hideAliasClicks = siteConfig['hideAliasClicks'] || false;
  var enableTracking = siteConfig['enableTracking'] || false;
  var disableCookies = siteConfig['disableCookies'] || false;

  if (
    !enableTracking ||
    !matomoUrl ||
    !siteId ||
    typeof trackSubdomains !== "boolean" ||
    typeof insertDomainName !== "boolean" ||
    typeof hideAliasClicks !== "boolean" ||
    typeof enableTracking !== "boolean" ||
    typeof disableCookies !== "boolean"
  ) {
    return; // App is not properly configured or tracking is disabled.
  }

  var snippet = '/* Matomo */';
  snippet += 'var _paq = window._paq = window._paq || [];';
  snippet += '_paq.push(["setTrackerUrl", "' + matomoUrl + '/matomo.php"]);';
  snippet += '_paq.push(["setSiteId", "' + siteId + '"]);';
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

  return {
      contentType: 'application/javascript; charset=utf-8',
      body: snippet
  };
}
