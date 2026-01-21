var portalLib = require('/lib/xp/portal');

exports.responseProcessor = function (req, res) {
  if (req.mode !== 'live') {
    return res; // We don't need to tell Analytics about things done in Content Studio
  }

  var siteConfig = portalLib.getSiteConfig();
  if (!siteConfig) {
    log.error("Failed to get site config in Matomo Analytics");
    return res; // Something is wrong, so we stop.
  }

  var matomoUrl = portalLib.sanitizeHtml(siteConfig['matomoUrl'] || '');
  var matomoJavaScriptUrl = portalLib.sanitizeHtml(siteConfig['matomoJavaScriptUrl'] || '');
  var siteId = portalLib.sanitizeHtml(siteConfig['siteId'] || '1');
  // Sometimes it is necessary to override the default 8 day cache
  var cacheOverrideMatomoTagManager = siteConfig['cacheOverrideMatomoTagManager'] || '';
  var overrideAddon = cacheOverrideMatomoTagManager ? '?date=' + cacheOverrideMatomoTagManager : '';
  var matomoOptions = siteConfig.options || {};
  var enableTracking = matomoOptions['enableTracking'] || false;
  var trackDisabledJS = matomoOptions['trackDisabledJS'] || false;
  var matomoTagManagerContainerId = '';
  if (siteConfig.matomoTagManager) {
    matomoTagManagerContainerId = portalLib.sanitizeHtml(siteConfig.matomoTagManager.containerId || '');
  }

  if (
    !enableTracking ||
    !matomoUrl ||
    !matomoJavaScriptUrl ||
    !siteId ||
    typeof trackDisabledJS !== "boolean"
  ) {
    log.error("Matomo app is not properly configured or tracking is disabled");
    return res; // App is not properly configured or tracking is disabled
  }

  var headEnd = res.pageContributions.headEnd;
  if (!headEnd) {
    res.pageContributions.headEnd = [];
  } else if (typeof(headEnd) == 'string') {
    res.pageContributions.headEnd = [headEnd];
  }
  var bodyEnd = res.pageContributions.bodyEnd;
  if (!bodyEnd) {
    res.pageContributions.bodyEnd = [];
  } else if (typeof(bodyEnd) == 'string') {
    res.pageContributions.bodyEnd = [bodyEnd];
  }

  let siteRootPath = portalLib.pageUrl({ id: portalLib.getSite()._id });
  // Site vhost is mounted on domain root, e.g. www.example.com
  if (siteRootPath === "/") {
    siteRootPath = "";
  }

  res.pageContributions.headEnd.push("<script defer src=\"" + siteRootPath + "/matomo.js\"></script>");
  if (matomoTagManagerContainerId) {
    res.pageContributions.headEnd.push("<script defer src=\"" + matomoJavaScriptUrl + "/container_" + matomoTagManagerContainerId + ".js" + overrideAddon + "\"></script>");
  }
  if (!matomoTagManagerContainerId) {
    res.pageContributions.headEnd.push("<script defer src=\"" + matomoJavaScriptUrl + "/matomo.js\"></script>");
  }

  if (trackDisabledJS) {
    res.pageContributions.bodyEnd.push('<noscript><p><img src="' + matomoUrl + '/matomo.php?idsite=' + siteId + '&amp;rec=1" style="border:0;" alt="" /></p></noscript>');
  }

  return res;
};
