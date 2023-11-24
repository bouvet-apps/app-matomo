const libs = {
  httpClient: require("/lib/http-client"),
  portal: require("/lib/xp/portal"),
  thymeleaf: require("/lib/thymeleaf"),
  content: require("/lib/xp/content"),
};

const settings = {
  responseFormat: "JSON"
}

const token = app.config['matomo.token'];

exports.get = function (req) {
  if (!req.params.contentId) {
    const errorView = resolve("./error-handler/error.html");
    const errorModel = {
      styleUri: libs.portal.assetUrl({
        path: "matomo.css"
      }),
    };
    return {
      body: libs.thymeleaf.render(errorView, errorModel),
      contentType: 'text/html'
    };
  }

  const view = resolve("./matomo.html");
  const config = libs.content.getSite({key: req.params.contentId}).data.siteConfig;
  const matomoConfig = config.filter(function(obj) {
    return obj.applicationKey === "no.bouvet.app.matomo"
  })[0];

  const model =  {
    styleUri: libs.portal.assetUrl({
      path: "matomo.css"
    }),
    pageData: {
      yesterday: getPageUrl('yesterday', 'day'),
      lastWeek: getPageUrl('lastWeek', 'day'),
      lastMonth: getPageUrl('lastMonth', 'day')
    },
  };

  function getPageUrl(date, period) {
    if (req.params.contentId && matomoConfig.config.domainName) {
      const contentPath = libs.content.get({ key: req.params.contentId })._path;
      const sitePath = libs.content.getSite({ key: req.params.contentId })._path;
      const relativeContentPath = contentPath.replace(sitePath, '');
      const domainName = matomoConfig.config.domainName;
      const pageUrl = 'https://' + domainName + relativeContentPath

      const response = libs.httpClient.request({
        url: `https:${matomoConfig.config.matomoUrl}/?module=API&method=Actions.getPageUrl&pageUrl=${pageUrl}&date=${date}&period=${period}&idSite=${matomoConfig.config.siteId}&format=${settings.responseFormat}&token_auth=${token}`
      })

      let data = JSON.parse(response.body);
      return data[0]; // Always returns array with one object
    } else {
      throw new Error("Failed fetching report")
    }
  }

  function getUniqueVisitors(date, period){
    const response = libs.httpClient.request({
      url: `https:${matomoConfig.config.matomoUrl}/?module=API&method=VisitsSummary.getUniqueVisitors&date=${date}&period=${period}&idSite=${matomoConfig.config.siteId}&format=${settings.responseFormat}&token_auth=${token}`
    })
    return JSON.parse(response.body).value;
  }

  function getCountryGraph(date, period){
    return `https:${matomoConfig.config.matomoUrl}/?module=API&method=ImageGraph.get&idSite=${matomoConfig.config.siteId}&apiModule=UserCountry&apiAction=getCountry&graphType=horizontalBar&period=${period}&date=${date}&width=500&height=250&format=${settings.responseFormat}&token_auth=${token}`;
  }

  return {
    body: libs.thymeleaf.render(view, model),
    contentType: 'text/html'
  };
};
