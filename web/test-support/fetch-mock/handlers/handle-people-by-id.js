const { createResponse } = require("../../integration-http.js");
const { parseBody, invalidPayload, notFound, trimmedValue } = require("../helpers.js");

function handlePeopleByID(pathname, method, options, stores) {
  const personMatch = pathname.match(/^\/api\/people\/(\d+)$/);
  if (!personMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(personMatch[1]);
    const payload = parseBody(options);
    const name = trimmedValue(payload.name);
    if (!name) {
      return invalidPayload("name is required");
    }

    const index = stores.peopleStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("person not found");
    }

    const updated = {
      id,
      name,
    };
    stores.peopleStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(personMatch[1]);
    const index = stores.peopleStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("person not found");
    }

    stores.peopleStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handlePeopleByID };
