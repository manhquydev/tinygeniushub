const fs = require('fs');
const p = 'D:/project/cungcontuhoc/plans/reports/brainstorm-20260226-owl-family-character-design.md';
const content = require('./owl-content.json');
fs.writeFileSync(p, content, 'utf8');
console.log('Written: ' + content.length + ' chars');
