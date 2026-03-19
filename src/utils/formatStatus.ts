// utils/formatStatus.ts
import { TFunction } from "i18next";

export const formatStatus = (status: string, t: TFunction) => {
  return t(`buyer.status.${status}`, status);
};
