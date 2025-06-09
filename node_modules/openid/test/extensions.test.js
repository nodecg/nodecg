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

test('Attribute Exchange (AX) values are parsed', () => {
    const ax = new openid.AttributeExchange(),
        results = {},
        exampleParams = {
          'openid.ax.type.email' :  'http://axschema.org/contact/email',
          'openid.ax.value.email' : 'fred.example@gmail.com',
          'openid.ax.type.language' : 'http://axschema.org/pref/language',
          'openid.ax.value.language' : 'english',
          'openid.ax.type.phones' : 'http://axschema.org/contact/phone/cell',
          'openid.ax.count.phones' : '2',
          'openid.ax.value.phones.1' : '+1 (555) 555-5555',
          'openid.ax.value.phones.2' : '+33 6 55 55 55 55',
          'openid.ax.value.phones.3' : '+46 5 5555 5555',
        }
    ax.fillResult(exampleParams, results);
  
    expect(results['email']).toBe('fred.example@gmail.com');
    expect(results['http://axschema.org/contact/email']).toBe('fred.example@gmail.com');
    expect(results['language']).toBe('english');
    expect(results['http://axschema.org/pref/language']).toBe('english');
    expect(results['phones'].length).toBe(2);
    expect(results['phones'][0]).toBe('+1 (555) 555-5555');
    expect(results['phones'][1]).toBe('+33 6 55 55 55 55');
  });
  
  test('PAPE values are parsed', () => {
    const authDate = new Date().toISOString();
    const exampleParams = {
          "openid.pape.auth_time" : authDate,
          "openid.pape.auth_policies" : 'http://schemas.openid.net/pape/policies/2007/06/multi-factor http://schemas.openid.net/pape/policies/2007/06/phishing-resistant'
        };
    const pape = new openid.PAPE(),
        results = {};
  
    pape.fillResult(exampleParams, results);
    expect(results['auth_time']).toBe(authDate);
    expect(results['auth_policies']).toBe('multi-factor phishing-resistant');
  });
  