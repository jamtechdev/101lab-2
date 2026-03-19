import Swal from "sweetalert2";

//  General alert
export const showAlert = (title: string, text?: string, icon: "success" | "error" | "warning" | "info" = "info") => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
  });
};

// Success alert
export const showSuccess = (message: string) => {
  return Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    confirmButtonText: "OK",
  });
};

// Error alert
export const showError = (message: string) => {
  


  return Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonText: "OK",
  });
};

// Warning alert
export const showWarning = (message: string) => {
  return Swal.fire({
    title: "Warning!",
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
  });
};

// Confirm delete alert
export const confirmDelete = async (item: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: `Delete ${item}?`,
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  return result.isConfirmed;
};
