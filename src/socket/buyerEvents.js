const subscribers = new Set();

export const subscribeBuyerEvents = (callback) => {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
};

export const emitBuyerEvent = () => {
  subscribers.forEach((fn) => fn());
};
