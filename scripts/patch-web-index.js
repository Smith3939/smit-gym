const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const darkThemeColor = '#0A0E1A';

if (!fs.existsSync(indexPath)) {
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(
  /<meta name="viewport" content="([^"]*)"\s*\/?>/,
  (_, content) => {
    const nextContent = content.includes('viewport-fit=cover')
      ? content
      : `${content}, viewport-fit=cover`;

    return `<meta name="viewport" content="${nextContent}" />`;
  }
);

const requiredMetaTags = [
  `<meta name="theme-color" content="${darkThemeColor}" />`,
  `<meta name="msapplication-navbutton-color" content="${darkThemeColor}" />`,
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
];

for (const tag of requiredMetaTags) {
  const nameMatch = tag.match(/name="([^"]+)"/);
  const name = nameMatch?.[1];

  if (name && !html.includes(`name="${name}"`)) {
    html = html.replace('</head>', `  ${tag}\n</head>`);
  }
}

fs.writeFileSync(indexPath, html);
