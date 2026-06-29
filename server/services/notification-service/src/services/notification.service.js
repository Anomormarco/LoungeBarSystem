const { emitToOrganization } = require("../socket");

function emitInternalEvent({ organizationId, eventName, payload }) {
  if (!organizationId || !eventName) {
    const error = new Error("organizationId болон eventName шаардлагатай.");
    error.statusCode = 400;
    throw error;
  }

  emitToOrganization(organizationId, eventName, payload);
  return { success: true };
}

module.exports = {
  emitInternalEvent,
};
