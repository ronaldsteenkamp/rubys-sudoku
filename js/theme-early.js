// Zet het thema van vandaag meteen bij het laden, nog vóór js/ui.js er is,
// zodat er geen ander thema flitst (bijvoorbeeld haar eigen thema op een
// wedstrijddag). ui.js bewaart het thema van vandaag (saveThemeToday in
// storage.js). Is dat van een andere dag, dan blijft de pagina heel even
// onzichtbaar tot ui.js het juiste thema heeft gezet (html[data-theme-pending]
// in style.css; na hooguit 1,2 seconde verschijnt hij hoe dan ook).
// Een gewoon script (geen module), zodat het meteen draait.
(function () {
  var html = document.documentElement;
  try {
    var params = new URLSearchParams(location.search);
    var test = params.has('vandaag');
    var o = /^(\d{4})-(\d{2})-(\d{2})/.exec(params.get('vandaag') || '');
    var now = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var day = o ? o[1] + '-' + o[2] + '-' + o[3] : now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var saved = JSON.parse(localStorage.getItem((test ? 'rubys-sudoku-test:' : 'rubys-sudoku:') + 'theme-today') || 'null');
    if (saved && saved.day === day && params.get('dagthema') !== 'uit' && typeof saved.theme === 'string') {
      html.setAttribute('data-theme', saved.theme);
      if (saved.accent) html.setAttribute('data-accent', saved.accent);
      // Dagverloop: de kleuren van het laatste kwartier, tot ui.js de echte van nu zet.
      if (saved.vars && typeof saved.vars === 'object') {
        for (var k in saved.vars) if (/^[a-z0-9-]+$/.test(k)) html.style.setProperty('--' + k, String(saved.vars[k]));
        if (saved.scheme === 'dark' || saved.scheme === 'light') { html.style.colorScheme = saved.scheme; html.setAttribute('data-scheme', saved.scheme); }
      }
      return;
    }
  } catch (e) { /* geen opslag: dan wacht de pagina gewoon even op ui.js */ }
  html.setAttribute('data-theme-pending', '');
})();
