export function definePort(name, methods) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new TypeError('A port must have a non-empty name.');
  }

  if (!Array.isArray(methods) || methods.length === 0) {
    throw new TypeError(`${name} must declare at least one method.`);
  }

  const normalizedMethods = methods.map((method) => {
    if (typeof method !== 'string' || !method.trim()) {
      throw new TypeError(`${name} contains an invalid method name.`);
    }

    return method.trim();
  });

  if (new Set(normalizedMethods).size !== normalizedMethods.length) {
    throw new TypeError(`${name} must not declare duplicate methods.`);
  }

  const requiredMethods = Object.freeze(normalizedMethods);

  return Object.freeze({
    name,
    methods: requiredMethods,
    assert(adapter) {
      if (!adapter || (typeof adapter !== 'object' && typeof adapter !== 'function')) {
        throw new TypeError(`${name} adapter must be an object.`);
      }

      const missingMethods = requiredMethods.filter(
        (method) => typeof adapter[method] !== 'function',
      );

      if (missingMethods.length > 0) {
        throw new TypeError(`${name} adapter is missing: ${missingMethods.join(', ')}.`);
      }

      return adapter;
    },
  });
}
