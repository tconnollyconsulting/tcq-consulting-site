(function () {
  'use strict';

  function record(eventName, appName) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, { app_name: appName });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-tcq-click]');
    if (!link) return;

    var appName = link.getAttribute('data-app');
    var clickType = link.getAttribute('data-tcq-click');
    if (!appName || !clickType) return;

    record(clickType === 'app-icon' ? 'app_icon_click' : 'app_store_click', appName);
  });
})();
