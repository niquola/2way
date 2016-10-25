'use strict';

function isString(s) {
  return typeof s === 'string' || s instanceof String;
}

function isObject(s) {
  return (typeof s === 'object') && (s !== null);
}

function isArray(s) {
  return Array.isArray(s);
}

/* eslint-disable */
function isUndefined(s){
  return typeof(s) === 'undefined';
}
/* eslint-enable */

function isPresent(x) {
  return x || x === false;
}

var match = (pat, obj) => {
  if (isArray(pat)) {
    if (!isArray(obj)) { return false; }
    let res = true;
    for (const k of pat) {
      res = res && match(pat[k], obj[k]);
    }
    return res;
  } else if (isObject(pat)) {
    if (!isObject(obj)) { return false; }
    let res = true;
    for (const k in pat) {
      res = res && match(pat[k], obj[k]);
    }
    return res;
  }
  return pat === obj;
};


var extract = (obj, rule) => {
  let cur = obj;
  for (const x of rule) {
    if (Number.isInteger(x) || isString(x)) {
      cur = cur[x];
    } else if (isObject(x)) {
      if (Array.isArray(cur)) {
        if (x.$collection) {
          if (x.$filter) {
            cur = cur.filter((y) => match(x.$filter, y));
          } else {
            cur = cur;
          }
        } else {
          cur = cur.filter((y) => match(x, y))[0];
        }
      } else {
        throw new Error('Not supported');
      }
    } else {
      throw new Error('Not supported');
    }
    if (!isPresent(cur)) { return null; }
  }
  return cur;
};


var inject = (obj, rule, val) => {
  let cur = obj;
  for (let i = 0; i < rule.length; i++) {
    const x = rule[i];
    if (isObject(x) && isArray(cur)) {
      if (x.$collection) {
        if (isArray(val)) {
          if (i !== (rule.length - 1)) { throw new Error('unexpected'); }
          /* eslint-disable */
          cur.push.apply(cur, val);
          /* eslint-enable */
          return obj;
        }
        throw new Error('unexpected');
      } else {
        const m = cur.filter((y) => match(x, y))[0];
        if (m) {
          cur = m;
        } else {
          const templ = Object.assign({}, x);
          cur.push(templ);
          cur = templ;
        }
      }
    /* eslint-disable */
    } else if (!cur[x]) {
      const next_x = rule[i + 1];
    /* eslint-enable */
      if (isObject(next_x) && next_x.$collection) {
        cur[x] = val;
        return obj;
      } else if (Number.isInteger(next_x) || isObject(next_x)) {
        cur[x] = [];
        cur = cur[x];
      } else if (isString(next_x)) {
        cur[x] = {};
        cur = cur[x];
      } else {
        cur[x] = val;
        return obj;
      }
    } else {
      cur = cur[x];
    }
    if (!cur) { return null; }
  }
  return obj;
};


var transform = (obj, mapping, direction) => {
  const from = direction[0];
  const to = direction[1];

  /* eslint-disable */
  return mapping.reduce((acc, item) => {
    let to_rule = item[to];
    if (!to_rule) { return acc; }

    let from_rule = item[from];
    let to_const = item[`${to}_const`];

    let val = null;

    if (from_rule) {
      val = extract(obj, from_rule);
    } else if (isPresent(to_const)) {
      val = to_const;
    } else if (item.calculate) {
      val = extract(acc, item.calculate);
    }

    let to_fn = item[`to_${to}`];

    if (to_fn && isPresent(val)) {
      val = to_fn(val);
    }

    if (isPresent(val)) {
      if(item.$mapping){
        let lastRule = to_rule[to_rule.length - 1];
        val = val.map((v)=> {
          let tv = transform(v, item.$mapping, direction);
          if(lastRule.$filter){
            return Object.assign({}, tv, lastRule.$filter);
          }
          return tv;
        });
      }
      return inject(acc, to_rule, val);
    }

    if (item.required) {
      throw new Error(`${JSON.stringify(item)} with ${JSON.stringify(obj)}`);
    }
    return acc;
  }, {});
};

module.exports.extract = extract;
module.exports.match = match;
module.exports.inject = inject;
module.exports.transform = transform;
