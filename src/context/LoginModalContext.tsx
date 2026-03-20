import { createContext, useContext, useState, useRef } from "react";
import LoginModal from "@/components/common/LoginModal";

interface OpenLoginModalOptions {
  onSuccess?: () => void;
  portalType?: "buyer" | "seller" | "admin";
}

interface LoginModalContextType {
  openLoginModal: (options?: OpenLoginModalOptions) => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType>({
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

export const useLoginModal = () => useContext(LoginModalContext);

export const LoginModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const onSuccessRef = useRef<(() => void) | undefined>(undefined);
  const [portalType, setPortalType] = useState<"buyer" | "seller" | "admin">("buyer");

  const openLoginModal = (options?: OpenLoginModalOptions) => {
    onSuccessRef.current = options?.onSuccess;
    setPortalType(options?.portalType ?? "buyer");
    setOpen(true);
  };

  const closeLoginModal = () => {
    onSuccessRef.current = undefined;
    setOpen(false);
  };

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      <LoginModal
        open={open}
        onClose={closeLoginModal}
        onSuccess={onSuccessRef.current}
        portalType={portalType}
      />
    </LoginModalContext.Provider>
  );
};
