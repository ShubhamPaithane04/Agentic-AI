export const PREVIEW_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export function pickIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const icons = {
    jsx: 'JS',
    js: 'JS',
    tsx: 'TS',
    ts: 'TS',
    css: 'CS',
    json: 'JN',
    md: 'MD',
    py: 'PY',
    html: 'HT',
  };
  return icons[ext] || 'FI';
}

// Heuristics for "this needs a real bundler/dev server and can't be faked
// inside a srcDoc iframe" — ES module imports, JSX syntax, or a package.json
// alongside a React/Vue/etc-style entry point. Concatenating this raw into a
// <script> tag just throws a silent SyntaxError and leaves a blank preview.
function detectsBundlerProject(fileNames, files) {
  if (fileNames.some((name) => /(^|\/)package\.json$/i.test(name))) return true;
  if (fileNames.some((name) => /\.(jsx|tsx)$/i.test(name))) return true;

  const jsLikeFiles = fileNames.filter((name) => /\.(js|ts)$/i.test(name));
  for (const name of jsLikeFiles) {
    const content = files[name] || '';
    if (/^\s*(import|export)\s/m.test(content)) return true;
    if (/\breact-dom\/client\b|\bReactDOM\.(createRoot|render)\b/.test(content)) return true;
  }
  return false;
}

export function buildPreviewDocument(files, preferredEntry = '') {
  const fileNames = Object.keys(files || {});
  const htmlEntry =
    (preferredEntry && fileNames.includes(preferredEntry) ? preferredEntry : '') ||
    fileNames.find((name) => /(^|\/)(preview|index\.preview)\.html$/i.test(name)) ||
    fileNames.find((name) => name.toLowerCase().endsWith('index.html')) ||
    fileNames.find((name) => name.toLowerCase().endsWith('.html'));

  if (!htmlEntry) {
    return {
      canPreview: false,
      reason:
        'Preview currently supports HTML, CSS, and JavaScript outputs. Ask for a landing page, portfolio, or static website to see a live render here.',
    };
  }

  let html = files[htmlEntry] || '';
  if (!html) {
    return { canPreview: false, reason: 'The HTML entry file was empty.' };
  }

  if (detectsBundlerProject(fileNames, files)) {
    return {
      canPreview: false,
      entryFile: htmlEntry,
      reason:
        'This project uses React/npm-style build tooling (JSX, ES module imports, or a bundler). That needs a real dev server to compile — it can\'t run directly inside this preview pane. ' +
        'Run it locally instead: open a terminal in the project folder, run "npm install" once, then "npm start" (or "npm run dev"), and open the localhost URL it prints.',
    };
  }

  const cssFiles = fileNames.filter((name) => name.toLowerCase().endsWith('.css'));
  const jsFiles = fileNames.filter((name) => name.toLowerCase().endsWith('.js'));

  const inlineStyles = cssFiles
    .map((name) => files[name])
    .filter(Boolean)
    .join('\n\n');
  const inlineScripts = jsFiles
    .map((name) => files[name])
    .filter(Boolean)
    .join('\n\n');

  html = html.replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '');
  html = html.replace(/<script[^>]+src=["'][^"']+\.js["'][^>]*><\/script>/gi, '');

  if (inlineStyles) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>${inlineStyles}</style></head>`);
    } else {
      html = `<style>${inlineStyles}</style>${html}`;
    }
  }

  if (inlineScripts) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `<script>${inlineScripts}</script></body>`);
    } else {
      html = `${html}<script>${inlineScripts}</script>`;
    }
  }

  return { canPreview: true, document: html, entryFile: htmlEntry };
}

export function pickPrimaryFiles(files) {
  const fileNames = Object.keys(files || {});
  const priorityPatterns = [
    /(^|\/)(preview|index\.preview)\.html$/i,
    /(^|\/)index\.html$/i,
    /(^|\/)src\/app\.(jsx|tsx|js|ts)$/i,
    /(^|\/)server\.js$/i,
    /(^|\/)app\.py$/i,
    /(^|\/)main\.py$/i,
    /(^|\/)src\/Main\.java$/i,
    /(^|\/)src\/main\.cpp$/i,
    /(^|\/)index\.php$/i,
    /(^|\/)readme\.md$/i,
    /\.(jsx|tsx|js|ts|py|html|css|java|cpp|php)$/i,
  ];

  const ordered = [];
  for (const pattern of priorityPatterns) {
    for (const name of fileNames) {
      if (pattern.test(name) && !ordered.includes(name)) {
        ordered.push(name);
      }
    }
  }

  return ordered.slice(0, 6);
}
