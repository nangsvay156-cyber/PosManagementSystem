// utils/apiResponse.js

const success = (res, statusCodeOrOpts, message, data, meta) => {
  if (typeof statusCodeOrOpts === 'object') {
    const { message: msg = 'Success', data: d = null, statusCode = 200, meta: m = null } = statusCodeOrOpts;
    const payload = { success: true, message: msg };
    if (d !== null) payload.data = d;
    if (m !== null) payload.meta = m;
    return res.status(statusCode).json(payload);
  }

  const payload = { success: true, message: message || 'Success' };
  if (data !== undefined && data !== null) payload.data = data;
  if (meta !== undefined && meta !== null) payload.meta = meta;
  return res.status(statusCodeOrOpts || 200).json(payload);
};

const error = (res, statusCodeOrOpts, message, errors) => {
  if (typeof statusCodeOrOpts === 'object') {
    const { message: msg = 'Something went wrong', statusCode = 500, errors: e = null } = statusCodeOrOpts;
    const payload = { success: false, message: msg };
    if (e !== null) payload.errors = e;
    return res.status(statusCode).json(payload);
  }

  const payload = { success: false, message: message || 'Something went wrong' };
  if (errors !== undefined && errors !== null) payload.errors = errors;
  return res.status(statusCodeOrOpts || 500).json(payload);
};

module.exports = { success, error };