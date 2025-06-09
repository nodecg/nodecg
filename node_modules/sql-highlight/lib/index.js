const keywords = require('./keywords');
const escapeHtml = require('./escapeHtml');

const DEFAULT_OPTIONS = {
  html: false,
  htmlEscaper: escapeHtml,
  classPrefix: 'sql-hl-',
  colors: {
    keyword: '\x1b[35m',
    function: '\x1b[31m',
    number: '\x1b[32m',
    string: '\x1b[32m',
    identifier: '\x1b[0m',
    special: '\x1b[33m',
    bracket: '\x1b[33m',
    comment: '\x1b[2m\x1b[90m',
    clear: '\x1b[0m'
  }
};

const highlighters = [
  /(?<number>[+-]?(?:\d+\.\d+|\d+|\.\d+)(?:E[+-]?\d+)?)/,

  // Note: Repeating string escapes like 'sql''server' will also work as they are just repeating strings
  /(?<string>'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/,

  /(?<comment>--[^\n\r]*|#[^\n\r]*|\/\*(?:[^*]|\*(?!\/))*\*\/)/,

  // Future improvement: Comments should be allowed between the function name and the opening parenthesis
  /\b(?<function>\w+)(?=\s*\()/,

  /(?<bracket>[()])/,

  /(?<identifier>\b\w+\b|`(?:[^`\\]|\\.)*`)/,

  /(?<whitespace>\s+)/,

  // Multi-character arithmetic, bitwise, comparison, and compound operators as listed in
  // https://www.w3schools.com/sql/sql_operators.asp, https://www.tutorialspoint.com/sql/sql-operators.htm,
  // https://data-flair.training/blogs/sql-operators/, plus any single character (in particular ,:;.) not matched by
  // the above regexps.
  /(?<special>\^-=|\|\*=|\+=|-=|\*=|\/=|%=|&=|>=|<=|<>|!=|!<|!>|>>|<<|.)/
];

// Regex of the shape /(?<token1>...)|(?<token2>...)|.../g
const tokenizer = new RegExp(
  [
    `\\b(?<keyword>${keywords.join('|')})\\b`,
    ...highlighters.map((regex) => regex.source)
  ].join('|'),
  'gis'
);

function getSegments(sqlString) {
  const segments = Array.from(sqlString.matchAll(tokenizer), (match) => ({
    name: Object.keys(match.groups).find((key) => match.groups[key]),
    content: match[0]
  }));
  return segments;
}

function highlight(sqlString, options) {
  const fullOptions = Object.assign({}, DEFAULT_OPTIONS, options);

  return getSegments(sqlString)
    .map(({ name, content }) => {
      if (fullOptions.html) {
        const escapedContent = fullOptions.htmlEscaper(content);
        return name === 'whitespace'
          ? escapedContent
          : `<span class="${fullOptions.classPrefix}${name}">${escapedContent}</span>`;
      }
      if (fullOptions.colors[name]) {
        return fullOptions.colors[name] + content + fullOptions.colors.clear;
      }
      return content;
    })
    .join('');
}

module.exports = {
  getSegments,
  highlight,
  DEFAULT_OPTIONS
};
