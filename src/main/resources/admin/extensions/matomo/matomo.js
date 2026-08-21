const libs = {
  httpClient: require("/lib/http-client"),
  thymeleaf: require("/lib/thymeleaf"),
  content: require("/lib/xp/content"),
  context: require("/lib/xp/context"),
  static: require("/lib/enonic/static"),
};
const Router = require("/lib/router");

const settings = {
  responseFormat: "JSON",
  staticBasePath: "/_static"
}

const token = app.config['matomo.token'];

// Config value may be a full URL, protocol-relative (//host) or a bare host
function toBaseUrl(url) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return (url.indexOf("//") === 0 ? "https:" : "https://") + url;
}

function getPageUrl(date, period, req, matomoConfig) {
  if (req.params.contentId && matomoConfig.config.domainName) {
    const contentPath = libs.content.get({ key: req.params.contentId })._path;
    const sitePath = libs.content.getSite({ key: req.params.contentId })._path;
    const relativeContentPath = contentPath.replace(sitePath, '');
    const domainName = matomoConfig.config.domainName;
    const pageUrl = 'https://' + domainName + relativeContentPath

    const response = libs.httpClient.request({
      url: `${toBaseUrl(matomoConfig.config.matomoUrl)}/?module=API&method=Actions.getPageUrl&pageUrl=${pageUrl}&date=${date}&period=${period}&idSite=${matomoConfig.config.siteId}&format=${settings.responseFormat}&token_auth=${token}`
    })

    let data = JSON.parse(response.body);
    return data[0]; // Always returns array with one object
  } else {
    throw new Error("Failed fetching report")
  }
}

function buildWidget(req) {
  const view = resolve("./matomo.html");
  const config = libs.content.getSite({key: req.params.contentId}).data.siteConfig;
  const matomoConfig = config.filter(function(obj) {
    return obj.applicationKey === "no.bouvet.app.matomo"
  })[0];

  const model =  {
    styleUri: `${req.contextPath}${settings.staticBasePath}/matomo.css`,
    pageData: {
      yesterday: getPageUrl('yesterday', 'day', req, matomoConfig),
      lastWeek: getPageUrl('lastWeek', 'day', req, matomoConfig),
      lastMonth: getPageUrl('lastMonth', 'day', req, matomoConfig)
    },
  };

  if (!model.pageData.yesterday && !model.pageData.lastWeek && !model.pageData.lastMonth) {
    return {
      contentType: "text/html",
      body: "<widget class='error'>No data found</widget>"
    };
  }

  return {
    body: libs.thymeleaf.render(view, model),
    contentType: 'text/html'
  };
}

function renderWidget(req) {
  if (!req.params.contentId) {
    return {
      contentType: "text/html",
      body: "<widget class='error'>No content selected</widget>"
    };
  }

  // XP8 admin requests have no default repository/branch context — set it explicitly
  return libs.context.run({
    repository: req.params.repository,
    branch: req.params.branch
  }, () => buildWidget(req));
}

const router = Router();

router.get(`${settings.staticBasePath}/{path:.*}`, (req) => libs.static.requestHandler(req, {
  index: false,
  root: "/assets",
  relativePath: libs.static.mappedRelativePath(settings.staticBasePath)
}));

router.get("", renderWidget);

exports.all = (req) => router.dispatch(req);
