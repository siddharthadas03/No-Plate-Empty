const getRejectedRetentionHours = () => {
  const configuredHours = Number(process.env.REJECTED_ACCOUNT_RETENTION_HOURS);

  if (Number.isFinite(configuredHours) && configuredHours > 0) {
    return configuredHours;
  }

  return 72;
};

const getRejectedDeletionDate = (baseDate = new Date()) =>
  new Date(baseDate.getTime() + getRejectedRetentionHours() * 60 * 60 * 1000);

const isRejectedExpired = (user, now = new Date()) => {
  if (!user?.isRejected || !user?.rejectionDeleteAt) {
    return false;
  }

  return new Date(user.rejectionDeleteAt).getTime() <= now.getTime();
};

const formatRejectedDeletionDate = (value) => {
  if (!value) {
    return `${getRejectedRetentionHours()} hours`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${getRejectedRetentionHours()} hours`;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildRejectedMessage = (user) => {
  const deleteAtLabel = formatRejectedDeletionDate(user?.rejectionDeleteAt);

  return `Admin rejected your registration. This account will be deleted on ${deleteAtLabel}.`;
};

module.exports = {
  buildRejectedMessage,
  formatRejectedDeletionDate,
  getRejectedDeletionDate,
  getRejectedRetentionHours,
  isRejectedExpired,
};
