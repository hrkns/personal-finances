function createResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

module.exports = {
  createResponse,
  normalize,
};
