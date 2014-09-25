/** @jsx React.DOM */
  
var App = require('./App.react');

Parse.initialize("B6xry2nLRUxSE4nxue6q4xzS1A2WmleBgY2UAZEY", "IeDF4F0c65lXnvgSDH1AiWguWKd6rt2DWbkD6EjE");

navigator.sayswho = (function () {
  var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR\/(\d+)/)
    if (tem != null) return 'Opera ' + tem[1];
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M.join(' ');
})();

var browser = navigator.sayswho.split(' ')[0];
if (browser === 'Chrome' || browser === 'Safari') {
  var version = navigator.sayswho.split(' ')[1];
  var major = version.split('.')[0];
  if (browser === 'Chrome' && major >= 33 ||
    browser === 'Safari' && major >= 7) {

    document.addEventListener('DOMContentLoaded', function () {
      React.renderComponent(
        <App />,
        document.body
      );
    });
  }
}

