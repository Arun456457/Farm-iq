const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf8').split('\n');
lines.filter(l => l.includes('app.get("/api/') || l.includes('app.post("/api/')).forEach(l => console.log(l.trim()));
