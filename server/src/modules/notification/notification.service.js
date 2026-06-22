async function createReservationNotification(tx, { organizationId, guestName, tableNumber }) {
  return tx.notification.create({
    data: {
      organizationId,
      title: "Shine zahialga",
      message: `${guestName} ni ${tableNumber} shireend zahialga uusgesen baina.`,
    },
  });
}

module.exports = {
  createReservationNotification,
};
