/**
 *  test addmessages
 */
const Sender = require('../index');

const sender = new Sender({
  host: 'localhost',
  port: '3003',
  db: 'test',
  measurement: 'test-measurement',
  duration: 2000,
  records: 200
});

const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 204;
  res.end('');
});

server.listen(3003);

let num = 1;

let num2 = 1;

setInterval(() => {
  if (num > 10000) {
    console.log('1 done!');
    return;
  }
  sender.addMessage({
    tags: {
      reqid: num + '',
      route: 'test'
    },
    fields: {
      dasd: 'd123asda'
    }
  });
  num++;
}, Math.random() * 10);


setInterval(() => {
  if (num2 > 10000) {
    console.log('2 done!');
    return;
  }
  sender.addMessage({
    tags: {
      reqid: num2 + '',
      route: 'test2'
    },
    fields: {
      dasd: '12131'
    }
  });
  num2++;
}, Math.random() * 10);
