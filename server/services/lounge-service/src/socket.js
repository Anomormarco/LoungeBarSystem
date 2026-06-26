const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3005";

async function emitToOrganization(organizationId, eventName, payload) {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId,
        eventName,
        payload,
      }),
    });
    if (!response.ok) {
      console.error(`[lounge-service-socket] Мэдэгдлийн сервис рүү event дамжуулахад алдаа гарлаа: ${response.statusText}`);
    }
  } catch (error) {
    console.error("[lounge-service-socket] Мэдэгдлийн сервистэй холбогдоход алдаа гарлаа:", error.message);
  }
}

module.exports = {
  emitToOrganization,
};
