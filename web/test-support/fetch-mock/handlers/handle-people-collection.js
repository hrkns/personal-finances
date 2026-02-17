const { createResponse } = require("../../integration-http.js");
const { parseBody, cloneItems, invalidPayload, trimmedValue } = require("../helpers.js");

function handlePeopleCollection(pathname, method, options, stores) {
  if (pathname === "/api/people" && method === "GET") {
    return createResponse(200, cloneItems(stores.peopleStore));
  }

  if (pathname === "/api/people" && method === "POST") {
    const payload = parseBody(options);
    const name = trimmedValue(payload.name);
    if (!name) {
      return invalidPayload("name is required");
    }

    const created = {
      id: stores.nextPersonId,
      name,
    };
    stores.nextPersonId += 1;
    stores.peopleStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handlePeopleCollection };
