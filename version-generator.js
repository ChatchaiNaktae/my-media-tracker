const fs = require('fs');

const version = Date.now();

const content = `const BUILD_VERSION = '${version}';`;

fs.writeFileSync('version.js', content);

console.log('Version generated:', version);