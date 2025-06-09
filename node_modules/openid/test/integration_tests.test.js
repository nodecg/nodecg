/* OpenID for node.js
 *
 * http://ox.no/software/node-openid
 * http://github.com/havard/node-openid
 *
 * Copyright (C) 2010 by Håvard Stranden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 */

const openid = require('../openid');
jest.useFakeTimers();

test('Identifier without OpenID providers', () => {
  openid.authenticate('example.com', 'http://example.com/verify', null, false, false,
    (error, url) => {
      expect(url).toBe(null);
      expect(error.message).toBe('No providers found for the given identifier');
    });
});

test('Empty identifier', () => {
  openid.discover('', 
    true,
    (error, providers) => {
      expect(providers).toBe(null);
      expect(error.message).toBe('Invalid identifier');
    });
});

// // 2016-09-09: XRI.net certificate has expired as of 2016-08-15, 
// // so disable this test for now.

// // test('Resolve =ryan XRI', () => {
// //   openid.discover('=ryan',
// //     true,
// //     (error, providers) => {
// //       expect(!error).toBe(true);
// //       expect(providers.length).toBe(2);
// //     });
// // });

// test('Resolve Steam', () => {
//   openid.discover('https://steamcommunity.com/openid',
//     true,
//     (error, providers) => {
//       expect(error).toBeFalsy();
//       expect(providers.length).toBe(1);
//     });
// });

// test('Resolve LiveJournal user', () => {
//   openid.discover('http://omnifarious.livejournal.com/',
//     true,
//     (error, providers) => {
//       expect(error).toBeFalsy();
//       expect(providers.length).toBe(1);
//     });
// });

// test('Resolve OpenID 1.1 provider', () => {
//   // FIXME: relying on a third party for back-level protocol support is brittle.
//   openid.discover('http://pupeno.com/',
//     true,
//     (error, providers) => {
//       expect(error).toBeFalsy();
//       expect(providers.length).toBe(1);
//       expect(providers[0].version).toBe('http://openid.net/signon/1.1');
//     });
// });

const performAssociation = (url, version) => {
  openid.discover(url,
    true,
    (error, providers) => {
      expect(error).toBeFalsy();
      expect(providers).not.toBeNull();
      expect(providers).toHaveLength(1);
      const provider = providers[0];
      openid.associate(provider, (error, result) => {
        expect(error).toBeFalsy();
        if (version) {
          expect(provider.version).toBe(version);
        }
        expect(result.expires_in).toBeTruthy();
      });
    }
  );
}

// test('Associate with https://login.ubuntu.com', () => {
//   performAssociation('https://login.ubuntu.com');
// });

// test('Associate with http://omnifarious.livejournal.com/', () => {
//   performAssociation('http://omnifarious.livejournal.com/');
// });
// test('Associate with https://matt.wordpress.com/', () => {
//   // FIXME: relying on a third party for back-level protocol support is brittle.
//   performAssociation('https://matt.wordpress.com/', 'http://openid.net/signon/1.1', test);
// });

// test('Immediate authentication with https://login.ubuntu.com', () => {
//   openid.authenticate('https://login.ubuntu.com', 
//   'http://example.com/verify', null, true, false, 
//   (error, url) => {
//     expect(error).toBeFalsy();
//     expect(url.indexOf('checkid_immediate')).not.toBe(-1);
//   });
// });

// test('Setup authentication with https://login.ubuntu.com', () => {
//   openid.authenticate('https://login.ubuntu.com', 
//   'http://example.com/verify', null, false, false, 
//   (error, url) => {
//     expect(error).toBeFalsy();
//     expect(url.indexOf('checkid_setup')).not.toBe(-1);
//   });
// });

// test('Setup authentication with https://login.ubuntu.com using RelyingParty object', () => {
//   const rp = new openid.RelyingParty(
//       'http://example.com/verify',
//       null,
//       false,
//       false,
//       null);
//   rp.authenticate('https://login.ubuntu.com', false, 
//   (error, url) => {
//     expect(error).toBeFalsy();
//     expect(url.indexOf('checkid_setup')).not.toBe(-1);
//   });
// });
