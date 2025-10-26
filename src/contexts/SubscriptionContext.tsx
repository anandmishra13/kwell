import React, { createContext, useState, useContext, ReactNode } from 'react';

type SubscriptionContextType = {
  isSubscribed: boolean;
  startTrial: () => void;
  setSubscribed: (v: boolean) => void;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const startTrial = () => setIsSubscribed(true);
  const setSubscribed = (v: boolean) => setIsSubscribed(v);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, startTrial, setSubscribed }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};