const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\/\* Bottom controls \*\/.+?\/\* Buttons \*\//s, `/* Bottom controls */
.shaka-custom-skin .shaka-bottom-controls {
  padding: 10px 15px !important;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%) !important;
  width: 100% !important;
  padding-bottom: 25px !important; /* Space for seek bar */
}

.shaka-custom-skin .shaka-controls-button-panel {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
}

/* Buttons */`);

fs.writeFileSync('src/index.css', css);
