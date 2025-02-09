import { createContext, useContext, useState } from "react";

const LoadingContext = createContext({
  isLoading: false,
  setLoading: (_loading: boolean) => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}

      {/* Global Loading UI */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="loader border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
