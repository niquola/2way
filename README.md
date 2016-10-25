# 2way

[![Build Status](https://travis-ci.org/niquola/2way.svg?branch=master)](https://travis-ci.org/niquola/2way)


Javascript 2 way mapping library


```js
var mapping = [
  {server: ['name', 'given'], client: ['firstName']},
  {server: ['name', 'family'], client: ['lastName']},
  {server: ['address', {use: 'home'}, 'line'], client: ['address_line']}
];

// transform(object, [fromKey, toKey])
var result = mapper.transform(
 {address_line: 'line', firstName: 'ivan', lastName: 'ivanov'},
 ['client', 'server']
);

var result =  {
  name: {given: 'ivan', family: 'ivanov'},
  address: [{use: 'home', line: 'line'}]
}

```
