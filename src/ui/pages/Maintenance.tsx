import { AlertTriangle } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 px-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <AlertTriangle className="text-yellow-500 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Service Under Maintenance</h1>
        <p className="text-gray-600 mt-2">
          We are currently performing scheduled maintenance to improve our
          service. Please check back soon.
        </p>
        <p className="text-gray-500 mt-4 text-sm">
          Thank you for your patience!
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
