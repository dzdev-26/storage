import https from 'https';

https.get('https://api.github.com/repos/sebastianjnuwu/acode-plugins/contents/packages/material-icons?ref=acode', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
