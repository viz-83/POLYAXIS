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

const isPresent = (v) => v !== undefined && v !== null && v !== '';

/**
 * Field-level validation. Schema: { field: { required, type: 'string'|'number'|'boolean'|'array', min, max,
 * maxLength, enum, itemsEnum } }. Absent / null / '' optional fields are skipped so incomplete forms can be
 * saved and completed later (SPEC-08). Valid numbers are coerced in place.
 * Returns a { field: message } map (empty when valid).
 */
function collectErrors(body, schema) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    if (rules.required && !isPresent(value)) {
      errors[field] = 'This field is required.';
      continue;
    }
    if (!isPresent(value)) continue;

    switch (rules.type) {
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(num) || !Number.isFinite(num)) { errors[field] = 'Must be a number.'; break; }
        if (rules.min !== undefined && num < rules.min) { errors[field] = `Must be at least ${rules.min}.`; break; }
        if (rules.max !== undefined && num > rules.max) { errors[field] = `Must be at most ${rules.max}.`; break; }
        body[field] = num;
        break;
      }
      case 'string':
        if (typeof value !== 'string') errors[field] = 'Must be text.';
        else if (rules.maxLength && value.length > rules.maxLength) errors[field] = `Must be at most ${rules.maxLength} characters.`;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') errors[field] = 'Must be true or false.';
        break;
      case 'array':
        if (!Array.isArray(value)) errors[field] = 'Must be a list.';
        else if (rules.itemsEnum && value.some((v) => !rules.itemsEnum.includes(v))) errors[field] = `Each item must be one of: ${rules.itemsEnum.join(', ')}.`;
        break;
      default:
        break;
    }
    if (!errors[field] && rules.enum && !rules.enum.includes(value)) {
      errors[field] = `Must be one of: ${rules.enum.join(', ')}.`;
    }
  }
  return errors;
}

/** Express middleware: `schema` per-field rules, optional `cross(body, errors)` for cross-field checks. */
function validateBody(schema, cross) {
  return (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    req.body = body;
    const errors = collectErrors(body, schema);
    if (cross) Object.assign(errors, cross(body, errors));
    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', errors);
    }
    next();
  };
}

/** Cross-field helper: `min` must not exceed `max` (only when both are present and valid). */
function rangeOrder(minField, maxField, label) {
  return (body, errors) => {
    if (errors[minField] || errors[maxField]) return {};
    if (isPresent(body[minField]) && isPresent(body[maxField]) && Number(body[minField]) > Number(body[maxField])) {
      return { [minField]: `Minimum ${label} cannot exceed the maximum.` };
    }
    return {};
  };
}

module.exports = { sanitiseBody, validateBody, collectErrors, rangeOrder, sanitiseString, deepSanitise, isPresent };
