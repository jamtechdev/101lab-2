import { DateTime } from "luxon";

export const convertUTCToLocalRange = (startUTC, endUTC) => {
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

//   const userTZ = "Asia/Taipei";

  const start = DateTime.fromISO(startUTC).setZone(userTZ).toFormat("h:mm a");

  const end = DateTime.fromISO(endUTC).setZone(userTZ).toFormat("h:mm a");

  return `${start} - ${end}`;
};
