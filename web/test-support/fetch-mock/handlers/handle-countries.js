const { createResponse } = require("../../integration-http.js");
const { cloneItems } = require("../helpers.js");

function handleCountries(pathname, method, options, stores) {
  if (pathname === "/api/countries" && method === "GET") {
    return createResponse(200, cloneItems(stores.countriesStore));
  }

  return null;
}

module.exports = { handleCountries };
