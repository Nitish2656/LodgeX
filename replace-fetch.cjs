const fs = require('fs');
let code = fs.readFileSync('src/data/store.jsx', 'utf8');

// replace all fetch( with authFetch(
code = code.replace(/fetch\(/g, 'authFetch(');

// revert login and signup
code = code.replace(/authFetch\(`\$\{API_BASE_URL\}\/auth\/login/g, 'fetch(`\$\{API_BASE_URL\}/auth/login');
code = code.replace(/authFetch\(`\$\{API_BASE_URL\}\/auth\/signup/g, 'fetch(`\$\{API_BASE_URL\}/auth/signup');

fs.writeFileSync('src/data/store.jsx', code);
