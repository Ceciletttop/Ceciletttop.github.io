(() => {
  const collage = document.querySelector('.about-collage');
  if (!collage) return;
  const photos = [...collage.querySelectorAll('.about-collage-photo')];
  const text = [collage.querySelector('.about-greeting'), collage.querySelector('.about-meta')];
  if (photos.length !== 4 || text.some(element => !element)) return;
  let pending = false;
  function centerText() {
    pending = false;
    // Measure without the previous offset so resize and font loading cannot accumulate shifts.
    text.forEach(element => { element.style.transform = 'none'; });
    const pictureRects = photos.map(element => element.getBoundingClientRect());
    const textRects = text.map(element => element.getBoundingClientRect());
    const center = rects => ({
      x: (Math.min(...rects.map(rect => rect.left)) + Math.max(...rects.map(rect => rect.right))) / 2,
      y: (Math.min(...rects.map(rect => rect.top)) + Math.max(...rects.map(rect => rect.bottom))) / 2
    });
    // Halve the visible blank area below the bottom portraits without moving the collage.
    const container = collage.closest('.about-container');
    const bottomGap = container.getBoundingClientRect().bottom - Math.max(...pictureRects.map(rect => rect.bottom));
    container.style.marginBottom = `${-Math.max(0, bottomGap) / 2}px`;
    const pictureCenter = center(pictureRects);
    const textCenter = center(textRects);
    const x = pictureCenter.x - textCenter.x;
    const y = pictureCenter.y - textCenter.y;
    text.forEach(element => {
      // The information group uses CSS zoom; compensate to move both text blocks equally.
      const zoom = parseFloat(getComputedStyle(element).zoom) || 1;
      element.style.transform = `translate(${x / zoom}px, ${y / zoom}px)`;
    });
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(centerText);
    }
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    [collage, ...photos, ...text].forEach(element => observer.observe(element));
  }
  photos.forEach(photo => photo.addEventListener('load', schedule));
  document.fonts?.ready.then(schedule);
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
})();
