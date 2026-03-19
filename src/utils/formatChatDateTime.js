import { DateTime } from "luxon";

export const formatChatDateTime = (utcDate) => {
  
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return DateTime
    .fromISO(utcDate, { zone: "utc" })
    .setZone(userTZ)
    .toFormat("dd LLL yyyy • h:mm a");
};
