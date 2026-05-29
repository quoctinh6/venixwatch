/**
 * ImageZoom.js — Hover zoom with magnification lens
 */

export class ImageZoom {
  /**
   * @param {string[]} images — Array of image URLs
   * @param {string} productName
   */
  constructor(images = [], productName = '') {
    this._images = images.length > 0 ? images : ['https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'];
    this._name = productName;
    this._activeIdx = 0;
    this._el = null;
  }

  render() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;';

    // Main image + zoom panel
    const mainRow = document.createElement('div');
    mainRow.style.cssText = 'display:flex;gap:20px;align-items:flex-start;';

    // Main image container
    const mainImgWrap = document.createElement('div');
    mainImgWrap.id = 'zoom-main';
    mainImgWrap.style.cssText = `
      position:relative;flex:1;aspect-ratio:1;background:#f8f8f8;overflow:hidden;cursor:crosshair;
      border:1px solid #e8e8e8;
    `;

    const mainImg = document.createElement('img');
    mainImg.id = 'zoom-main-img';
    mainImg.src = this._images[0];
    mainImg.alt = this._name;
    mainImg.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:16px;display:block;';
    mainImg.onerror = () => { mainImg.src = this._images[0]; };
    mainImgWrap.appendChild(mainImg);

    // Zoom lens
    const lens = document.createElement('div');
    lens.id = 'zoom-lens';
    lens.style.cssText = `
      position:absolute;width:120px;height:120px;
      border:2px solid #C9A84C;border-radius:50%;
      pointer-events:none;display:none;
      box-shadow:0 0 0 4px rgba(201,168,76,0.2);
      background:rgba(201,168,76,0.05);
    `;
    mainImgWrap.appendChild(lens);

    // Zoom result panel (desktop only)
    const zoomPanel = document.createElement('div');
    zoomPanel.id = 'zoom-panel';
    zoomPanel.style.cssText = `
      width:400px;height:400px;border:1px solid #e8e8e8;flex-shrink:0;
      overflow:hidden;display:none;background:#f8f8f8;
      background-repeat:no-repeat;
      position:sticky;top:80px;
    `;

    mainRow.appendChild(mainImgWrap);
    mainRow.appendChild(zoomPanel);

    // Thumbnails
    const thumbs = document.createElement('div');
    thumbs.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    this._images.forEach((src, i) => {
      const thumb = document.createElement('div');
      thumb.style.cssText = `
        width:72px;height:72px;background:#f8f8f8;cursor:pointer;
        border:2px solid ${i===0?'#C9A84C':'#e8e8e8'};overflow:hidden;transition:border-color .15s;
      `;
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${this._name} ${i+1}`;
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:4px;';
      img.onerror = () => { img.src = this._images[0]; };
      thumb.appendChild(img);
      thumb.addEventListener('click', () => {
        this._setActive(i, mainImg, thumbs, zoomPanel);
      });
      thumbs.appendChild(thumb);
    });

    // Mobile: tap for fullscreen
    mainImgWrap.addEventListener('click', (e) => {
      if (window.innerWidth < 768) this._openModal(this._images[this._activeIdx]);
    });

    // Desktop: hover zoom
    this._initHoverZoom(mainImgWrap, mainImg, lens, zoomPanel);

    wrap.appendChild(mainRow);
    wrap.appendChild(thumbs);
    this._el = wrap;
    return wrap;
  }

  _setActive(idx, mainImg, thumbsWrap, zoomPanel) {
    this._activeIdx = idx;
    mainImg.src = this._images[idx];
    zoomPanel.style.backgroundImage = `url(${this._images[idx]})`;
    thumbsWrap.querySelectorAll('div').forEach((t, i) => {
      t.style.borderColor = i === idx ? '#C9A84C' : '#e8e8e8';
    });
  }

  _initHoverZoom(container, img, lens, panel) {
    if (window.innerWidth < 768) return;

    container.addEventListener('mouseenter', () => {
      if (window.innerWidth < 768) return;
      lens.style.display = 'block';
      panel.style.display = 'block';
      panel.style.backgroundImage = `url(${this._images[this._activeIdx]})`;
      panel.style.backgroundSize = `${img.offsetWidth * 2.5}px ${img.offsetHeight * 2.5}px`;
    });

    container.addEventListener('mouseleave', () => {
      lens.style.display = 'none';
      panel.style.display = 'none';
    });

    container.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return;
      const rect = container.getBoundingClientRect();
      let x = e.clientX - rect.left - lens.offsetWidth / 2;
      let y = e.clientY - rect.top - lens.offsetHeight / 2;
      x = Math.max(0, Math.min(x, container.offsetWidth - lens.offsetWidth));
      y = Math.max(0, Math.min(y, container.offsetHeight - lens.offsetHeight));
      lens.style.left = `${x}px`;
      lens.style.top  = `${y}px`;

      const cx = x * 2.5;
      const cy = y * 2.5;
      panel.style.backgroundPosition = `-${cx}px -${cy}px`;
    });
  }

  _openModal(src) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    modal.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;object-fit:contain;" />`;
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }
}
