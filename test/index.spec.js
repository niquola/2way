'use strict';

let assert = require('assert');
let subj = require('../index.js');

let mapping = [
  {
    fhir: ['member', 'resourceType'],
    fhir_const: 'Practitioner'
  },
  {
    fhir: ['member', 'active'],
    fhir_const: true
  },
  {
    fhir: ['member', 'name', 0, 'family', 0],
    form: ['lastName']
  },
  {
    fhir: ['member', 'name', 0, 'given', 0],
    form: ['firstName']
  },
  {
    fhir: ['member', 'name', 0, 'suffix', 0],
    form: ['honorifics']
  },
  {
    fhir: ['member', 'name', 0, 'suffix', 0],
    form: ['honorifics']
  },
  {
    fhir: ['member', 'telecom', { system: 'phone' }, 'value'],
    form: ['phone']
  },
  {
    fhir: ['member', 'telecom', { system: 'email' }, 'value'],
    form: ['email']
  },
  {
    fhir: ['member', 'address', { use: 'work' }, 'line', 0],
    form: ['address1']
  },
  {
    fhir: ['member', 'address', { use: 'work' }, 'line', 1],
    form: ['address2']
  },
  {
    fhir: ['member', 'address', { use: 'work' }, 'city'],
    form: ['city']
  },
  {
    fhir: ['member', 'address', { use: 'work' }, 'postalCode'],
    form: ['zip']
  },
  {
    fhir: ['member', 'address', { use: 'work' }, 'state'],
    form: ['state']
  },
  {
    fhir: ['member', 'role', 0, 'code', 'coding', { system: 'http://snomed.info/sct' }, 'code'],
    form: ['role']
  },
  {
    fhir: ['member', 'qualification', 0, 'code', 'coding', { system: 'qualification' }, 'code'],
    form: ['qualifications']
  },
  {
    fhir: ['member', 'qualification', 0, 'code', 'coding', { system: 'qualification' }, 'display'],
    calculate: ['member', 'qualification', 0, 'code', 'coding', { system: 'qualification' }, 'code'],
    to_fhir: (x) => `->${x}`
  },
  {
    fhir: ['role', 0],
    to_fhir: (pcp) => pcp && { text: 'PCP', coding:[{ code: '446050000', system: 'http://snomed.info/sct' }]},
    form: ['pcp'],
    to_form: () => true
  },
];

const testsCases  = [
  [{}, { member: { resourceType: 'Practitioner', active: true }}],
  [{ lastName: 'Last' }, { member: { resourceType: 'Practitioner', active: true, name: [{ family: ['Last']}]}}],
  [{ phone: '11111' }, { member: { resourceType: 'Practitioner', active: true, telecom: [{ system: 'phone', value: '11111' }]}}],
  [{ email: 'ups@ups.com' }, { member: { resourceType: 'Practitioner', active: true, telecom: [{ system: 'email', value: 'ups@ups.com' }]}}],
  [{ city: 'city', state: 'state', address1: 'a1', address2: 'a2' }, { member: { resourceType: 'Practitioner', active: true, address: [{ use: 'work', state: 'state', city: 'city', line: ['a1', 'a2']}]}}],
  [{ role: 'role' }, { member: { resourceType: 'Practitioner',
                             active: true,
                             role: [{ code: { coding: [{ system: 'http://snomed.info/sct', code: 'role' }]}}]}}],
  [{ qualifications: '$$' }, { member: { resourceType: 'Practitioner',
                                     active: true,
                                     qualification: [{ code: { coding: [{ system: 'qualification', code: '$$', display: '->$$' }]}}]}}],

  [{ pcp: true }, { member: { resourceType: 'Practitioner', active: true },
                 role: [{ text: 'PCP', coding:[{ code: '446050000', system: 'http://snomed.info/sct' }]}]}],
];




describe('mapper', function() {
  it('extract', () => {
    let res = subj.extract(
      { a: { b: [{ c: 2, d: 3 }, { c: 1, d: 2 }]}},
      ['a', 'b', { c: 1 }, 'd']
    );
    assert.equal(res, 2);
  });

  it('map/unmap test', () => {
    for (let t of testsCases) {
      let res = subj.transform(t[0], mapping, ['form', 'fhir']);
      assert.deepEqual(res, t[1]);
      // console.log(JSON.stringify(res,null,2));

      let rev = subj.transform(res, mapping, ['fhir', 'form']);
      assert.deepEqual(rev, t[0]);
      // console.log(JSON.stringify(rev, null, 2));
    }
  });

  it('required test', () => {
    let testMapping = [
      {
        required: true,
        fhir: ['b'],
        form: ['a']
      }
    ];

    let res = subj.transform({ a: 1 }, testMapping, ['form', 'fhir']);
    assert.deepEqual(res, { b: 1 });
    assert.throws(() => {
      subj.transform({}, testMapping, ['form', 'fhir']);
    });
  });
});

describe('mapper arrays', function() {
  it('required test', () => {
    let item_mapping = [{
      fhir: ['value'],
      form: ['number']
    }];

    let testMapping = [{
      $mapping: item_mapping,
      fhir: ['telecom', {
        $filter: { system: 'phone' },
        $collection: true
      }],
      form: ['phones', { $collection: true }]
    }];

    let fhir = {
      telecom: [{ system: 'phone', value: '222' }, { system: 'phone', value: '333' }]
    };

    let form = {
      phones: [
        { number: '222' },
        { number: '333' }
      ]
    };

    let tfhir = subj.transform(form, testMapping, ['form', 'fhir']);

    assert.deepEqual(tfhir, fhir);

    let tform = subj.transform(fhir, testMapping, ['fhir', 'form']);

    assert.deepEqual(tform, form);

    let ttform = subj.transform(tfhir, testMapping, ['fhir', 'form']);
    assert.deepEqual(ttform, form);

  });
});
