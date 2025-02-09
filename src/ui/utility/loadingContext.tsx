import { createContext, useContext, useState, ReactNode } from "react";

// ✅ Define a proper type for context value
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// ✅ Provide a default empty function for better type safety
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}

      {/* ✅ Improved Global Loading UI */}
      {isLoading && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          aria-live="polite"
        >
          <div className="relative flex flex-col items-center">
            <div className="loader border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
            <p className="text-white mt-2">Loading...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

// ✅ Custom Hook for easy usage
export const useLoading = () => useContext(LoadingContext);
