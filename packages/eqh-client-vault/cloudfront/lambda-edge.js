/* eslint-disable semi, strict */

'use strict'

exports.addSecurityHeaders = (event, context, callback) => {
  // Get contents of response
  const response = event.Records[0].cf.response; // eslint-disable-line prefer-destructuring
  const headers = response.headers; // eslint-disable-line prefer-destructuring

  // For HTTP security headers, see: https://observatory.mozilla.org/analyze/vault.keyhub.app
  // For TLS security ciphers: see: https://www.ssllabs.com/ssltest/analyze.html?d=vault.keyhub.app&hideResults=on&latest

  // Enable HTTP Strict Transport Security (HSTS) to force clients to always connect via HTTPS
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubdomains; preload',
  }];
  // Enable cross-site filter (XSS) and tell browser to block detected attacks
  headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  }];
  // Prevent some browsers from MIME-sniffing a response away from the declared Content-Type
  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  }];
  // Disallow the site to be rendered within a frame (clickjacking protection)
  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY',
  }];
  // Only send the origin of the document as the referrer
  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin',
  }];
  // Enforce Certificate Transparency
  headers['expect-ct'] = [{
    key: 'Expect-CT',
    value: 'max-age=63072000, enforce',
  }];
  // Disallow loading of dangerous external scripts and resources
  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; style-src 'self'; img-src 'self'; media-src 'self'; manifest-src 'self'; font-src 'self'; script-src blob: 'self'; connect-src 'self'",
  }];

  // Return modified response
  callback(null, response);
};
