import toast from "react-hot-toast";

// success toast
export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
  });
};

// error toast
export const toastError = (message: string) => {
  toast.error(message, {
    duration: 3000,
    position: "top-right",
  });
};

// warning toast
export const toastWarning = (message: string) => {
  toast(message, {
    icon: "⚠️",
    duration: 3000,
    position: "top-right",
  });
};

// info toast
export const toastInfo = (message: string) => {
  toast(message, {
    icon: "ℹ️",
    duration: 3000,
    position: "top-right",
  });
};

// deleted success toast
export const toastDeleted = (item: string) => {
  toast.success(`${item} deleted successfully`, {
    duration: 3000,
    position: "top-right",
  });
};
