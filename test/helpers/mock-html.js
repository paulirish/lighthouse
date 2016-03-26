const jsdom = require('jsdom').jsdom;

module.exports = (headInsert, bodyInsert) => {
  headInsert = headInsert || '';
  bodyInsert = bodyInsert || '';

  const htmlString = `<!doctype html>
    <html>
      <head>
        ${headInsert}
        <title>Sample page</title>
      </head>
      <body>
        ${bodyInsert}
      </body>
    </html>`;

  const doc = jsdom(htmlString);

  return {
    window: doc.defaultView,
    html: htmlString
  };
};
