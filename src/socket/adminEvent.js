const subscribers = new Set();

export const subscribeAdminEvents = (callback) => {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
};

export const emitAdminEvent = () => {
  subscribers.forEach((fn) => fn());
};
