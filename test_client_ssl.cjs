const https = require('https');
const http = require('http');
const tls = require('tls');

console.log('Testing HTTPS connection to sannacrm.sannainnovations.com from client...');

const socket = tls.connect(443, 'sannacrm.sannainnovations.com', {
  servername: 'sannacrm.sannainnovations.com'
}, () => {
  console.log('TLS Handshake successful!');
  console.log('Authorized:', socket.authorized);
  console.log('Authorization Error:', socket.authorizationError);
  const cert = socket.getPeerCertificate();
  console.log('Cert Subject:', cert.subject);
  console.log('Cert Issuer:', cert.issuer);
  console.log('Cert Valid From:', cert.valid_from);
  console.log('Cert Valid To:', cert.valid_to);
  console.log('Subject Alt Name:', cert.subjectaltname);
  socket.end();
});

socket.on('error', (err) => {
  console.error('TLS Connection Error:', err);
});

const req = https.get('https://sannacrm.sannainnovations.com', (res) => {
  console.log('HTTPS GET Status Code:', res.statusCode);
  console.log('HTTPS Headers:', res.headers);
});
req.on('error', (e) => {
  console.error('HTTPS GET Error:', e);
});
