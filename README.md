# influx-batch-sender
[![NPM version][npm-image]][npm-url]
  
[npm-image]: https://img.shields.io/npm/v/influx-batch-sender.svg?style=flat-square
[npm-url]: https://npmjs.org/package/influx-batch-sender

buffer message and send them in a bulk.

## useage

```
npm i influx-batch-sender --save

or

yarn add influx-batch-sender

```

``` javascript
const Sender = require('../index');

const sender = new Sender({
    host: 'INFLUXDB_HOST',
    db: 'DATABASE',
    measurement: 'MEASUREMENT',
    duration: 2000,
    records:200
});

setInterval(() => {
    sender.addMessage({
        tags: {
            foo: 'sdasda'+Math.random(),
            bar: 'test'
        },
        fields: {
            data: "d123asda"
        }
    });
}, Math.random() * 100)

```
