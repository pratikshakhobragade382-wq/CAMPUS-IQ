const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Removes keys that can enable prototype-pollution attacks.
 * This protects code that later does unsafe object merges or relies on plain objects.
 */
function stripForbiddenKeys(root) {
  const stack = [{ value: root, depth: 0 }];
  const MAX_DEPTH = 25;

  while (stack.length > 0) {
    const { value, depth } = stack.pop();

    if (!value || typeof value !== 'object') continue;
    if (depth > MAX_DEPTH) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        stack.push({ value: item, depth: depth + 1 });
      }
      continue;
    }

    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        delete value[key];
        continue;
      }

      stack.push({ value: value[key], depth: depth + 1 });
    }
  }
}

module.exports = (req, _res, next) => {
  stripForbiddenKeys(req.body);
  stripForbiddenKeys(req.query);
  stripForbiddenKeys(req.params);
  next();
};
