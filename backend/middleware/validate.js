const { ApiError } = require('./errorHandler');

/** Strips HTML/script-significant characters and caps length — SPEC-07 / 8.4 input sanitisation. */
function sanitiseString(value, maxLength = 2000) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function deepSanitise(input) {
  if (typeof input === 'string') return sanitiseString(input);
  if (Array.isArray(input)) return input.map(deepSanitise);
  if (input && typeof input === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = deepSanitise(value);
    }
    return out;
  }
  return input;
}

/** Applies deepSanitise to req.body for every mutating request. */
function sanitiseBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitise(req.body);
  }
  next();
}

/**
 * Validates req.body against a simple schema: { field: { required, type, min, max, enum } }.
 * Throws a 400 ApiError listing every field-level violation (SPEC-07 field-level validation).
 */
function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const present = value !== undefined && value !== null && value !== '';

      if (rules.required && !present) {
        errors[field] = 'This field is required.';
        continue;
      }
      if (!present) continue;

      if (rules.type === 'number') {
        const num = Number(value);
        if (Number.isNaN(num)) {
          errors[field] = 'Must be a number.';
          continue;
        }
        if (rules.min !== undefined && num < rules.min) errors[field] = `Must be at least ${rules.min}.`;
        if (rules.max !== undefined && num > rules.max) errors[field] = `Must be at most ${rules.max}.`;
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors[field] = 'Must be text.';
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors[field] = `Must be one of: ${rules.enum.join(', ')}.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', errors);
    }
    next();
  };
}

module.exports = { sanitiseBody, validateBody, sanitiseString, deepSanitise };
