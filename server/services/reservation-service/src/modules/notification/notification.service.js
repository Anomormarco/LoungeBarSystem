async function createReservationNotification(tx, { organizationId, guestName, tableNumber }) {
  return tx.notification.create({
    data: {
      organizationId,
      title: "Shine zahialga",
      message: `${guestName} ширээ ${tableNumber} дээр захиалга үүсгэсэн байна.`,
    },
  });
}

module.exports = {
  createReservationNotification,
};
