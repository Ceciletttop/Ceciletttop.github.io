(() => {
  'use strict';
  const mediaTarget = target => target instanceof Element && target.closest('img,video,.work-card,.orbit-card,.media-slide,.about-collage-photo');
  document.addEventListener('contextmenu', event => {
    if (mediaTarget(event.target)) event.preventDefault();
  }, {capture: true});
  document.addEventListener('dragstart', event => {
    if (mediaTarget(event.target)) event.preventDefault();
  }, {capture: true});
  const style = document.createElement('style');
  style.textContent = 'img,video{-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none}';
  document.head.append(style);
  function protect(element) {
    if (element.matches('img,video')) element.setAttribute('draggable', 'false');
    if (element.matches('video')) {
      element.setAttribute('controlslist', 'nodownload');
    }
    element.querySelectorAll('img,video').forEach(protect);
  }
  protect(document.documentElement);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node instanceof Element) protect(node);
    }));
  }).observe(document.documentElement, {childList: true, subtree: true});
})();
