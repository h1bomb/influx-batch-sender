const test = require('ava');
const Sender = require('../index');

test.before(() => {
  const http = require('http');

  const server = http.createServer((req, res) => {
    res.statusCode = 204;
    res.end('');
  });

  server.listen(3003);
});

test('test normal send message', async t => {
  const sender = new Sender({
    host: 'localhost',
    port: 3003,
    db: 'test',
    measurement: 'test2'
  });

  sender.addMessage({
    tags: {
      a: 'a',
      b: 'b'
    },
    fields: {
      a: 'a',
      b: 'b'
    }
  });

  let codeRet = await new Promise((resolve, reject) => {
    sender.on('ok', code => {
      resolve(code);
    });
    sender.on('failed', code => {
      reject(code);
    });
  });

  t.is(codeRet, 204);
});

test('config error', t => {
  const sender = new Sender({
    host: 'localhost',
    port: 3003,
    records: 1,
    measurement: 'test2'
  });

  new Sender({
    port: 3003,
    db: 'test',
    measurement: 'test2'
  });
  sender.addMessage({
    tags: {
      a: 'a',
      b: 'b'
    },
    fields: {
      a: 'a',
      b: 'b'
    }
  });
  sender.addMessage({
    tags: {
      a: 2,
      b: 'b'
    },
    fields: {
      a: {dasd: 123},
      b: 1,
      c: null
    }
  });
  t.pass();
});
