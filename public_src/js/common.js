function option(some, errorText) {
  return some ?
    Parse.Promise.as(some) :
    Parse.Promise.error(Error(errorText || 'None'));
}

function optionIdx(idx, errorText) {
  return (idx >= 0) ?
    Parse.Promise.as(idx) :
    Parse.Promise.error(Error(errorText || 'None'));
}

function concat(arr, arr2) {
  return arr ? arr.concat(arr2) : arr2;
}

function map(arr, f) {
  return arr ? arr.map(f) : arr;
}

function startsWith(base, str) {
  return base.slice(0, str.length) === str;
}

module.exports = {
  option: option,
  optionIdx: optionIdx,
  concat: concat,
  map: map,
  startsWith: startsWith
};
