
const sellerSubscribers = new Set();

export const subscribeSellerEvents = (callback) => {
  sellerSubscribers.add(callback);
  return () => {
    sellerSubscribers.delete(callback);
  };
};

export const emitSellerEvent = () => {
  sellerSubscribers.forEach((fn) => fn());
};
