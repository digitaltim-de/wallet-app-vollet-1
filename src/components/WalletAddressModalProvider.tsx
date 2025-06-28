"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { WalletAddressModal } from "./WalletAddressModal";

interface WalletAddressModalContextType {
  showWalletAddress: (address: string, walletName?: string, coinSymbol?: string) => void;
  hideWalletAddress: () => void;
}

const WalletAddressModalContext = createContext<WalletAddressModalContextType | undefined>(undefined);

interface WalletAddressModalProviderProps {
  children: ReactNode;
}

export const WalletAddressModalProvider = ({ children }: WalletAddressModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState<string | undefined>();
  const [coinSymbol, setCoinSymbol] = useState<string | undefined>();

  const showWalletAddress = (address: string, name?: string, symbol?: string) => {
    setWalletAddress(address);
    setWalletName(name);
    setCoinSymbol(symbol);
    setIsOpen(true);
  };

  const hideWalletAddress = () => {
    setIsOpen(false);
  };

  return (
    <WalletAddressModalContext.Provider value={{ showWalletAddress, hideWalletAddress }}>
      {children}
      <WalletAddressModal
        isOpen={isOpen}
        onClose={hideWalletAddress}
        walletAddress={walletAddress}
        walletName={walletName}
        coinSymbol={coinSymbol}
      />
    </WalletAddressModalContext.Provider>
  );
};

export const useWalletAddressModal = () => {
  const context = useContext(WalletAddressModalContext);
  if (context === undefined) {
    throw new Error("useWalletAddressModal must be used within a WalletAddressModalProvider");
  }
  return context;
};
