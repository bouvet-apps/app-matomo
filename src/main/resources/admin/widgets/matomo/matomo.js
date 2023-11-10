const libs = {
  httpClient: require("/lib/http-client"),
  portal: require("/lib/xp/portal"),
  thymeleaf: require("/lib/thymeleaf"),
  content: require("/lib/xp/content")
};

const settings = {
  responseFormat: "JSON"
}
  
exports.get = function (req) {
  const view = resolve("./matomo.html");
  const config = libs.content.getSite({key: req.params.contentId}).data.siteConfig;
  const matomoConfig = config.filter(function(obj) {
    return obj.applicationKey === "no.bouvet.app.matomo"
  })[0];
  log.info(JSON.stringify(matomoConfig, null, 2));

  const model =  {
    styleUri: libs.portal.assetUrl({
      path: "matomo.css"
    })
  };

  model.uniqueVisitors = getUniqueVisitors();
  // Mangler token_auth
  model.countryGraphSrc = `https://bouvet.matomo.cloud/?module=API&method=ImageGraph.get&idSite=3&apiModule=UserCountry&apiAction=getCountry&graphType=horizontalBar&period=month&date=today&width=500&height=250&format=${settings.responseFormat}&token_auth=`;

  log.info(JSON.stringify(getCountryGraph()));

  return {
    body: libs.thymeleaf.render(view, model),
    contentType: 'text/html'
  };
};

function getUniqueVisitors(){
  const response = libs.httpClient.request({
    // Mangler token_auth
    url: `https://bouvet.matomo.cloud/?module=API&method=VisitsSummary.getUniqueVisitors&date=yesterday&period=day&idSite=3&format=${settings.responseFormat}&token_auth=`
  })
  return JSON.parse(response.body).value;
}

function getCountryGraph(){
  const response = libs.httpClient.request({
    // Mangler token_auth
    url: `https://bouvet.matomo.cloud/?module=API&method=ImageGraph.get&idSite=3&apiModule=UserCountry&apiAction=getCountry&graphType=horizontalBar&period=month&date=today&width=500&height=250&format=${settings.responseFormat}&token_auth=`
  })
  return response;
}
