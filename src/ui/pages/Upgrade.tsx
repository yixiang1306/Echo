import { useNavigate } from "react-router-dom";

const Upgrade: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Logo */}
      <div
        className="absolute top-5 left-10 cursor-pointer text-4xl font-bold mb-5"
        onClick={() => navigate("/app")}
      >
        <span className="text-black">Ask</span>
        <span className="text-indigo-500">Vox</span>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-8 text-center">Choose your plan</h1>

      {/* Plans Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Free Plan */}
        <div className="border rounded-lg shadow-md text-center p-6">
          <h2 className="text-xl font-bold mb-2">Free</h2>
          <p className="text-3xl font-bold">
            $0<span className="text-sm font-normal">/month</span>
          </p>
          <button
            className="mt-6 bg-gray-200 text-gray-600 py-2 px-6 rounded-full cursor-not-allowed"
            disabled
          >
            Current
          </button>
        </div>

        {/* Premium Plan */}
        <div className="border rounded-lg shadow-md text-center p-6">
          <h2 className="text-xl font-bold mb-2">Premium</h2>
          <p className="text-3xl font-bold">
            $10<span className="text-sm font-normal">/month</span>
          </p>
          <button className="mt-6 bg-indigo-600 text-white py-2 px-6 rounded-full hover:bg-indigo-700">
            Upgrade to Premium
          </button>
        </div>

        {/* One-Time Purchase */}
        <div className="border rounded-lg shadow-md text-center p-6">
          <h2 className="text-xl font-bold mb-2">One-Time Purchase</h2>
          <p className="text-3xl font-bold">
            $1<span className="text-sm font-normal">/10 tokens</span>
          </p>
          <button className="mt-6 bg-teal-500 text-white py-2 px-6 rounded-full hover:bg-teal-600">
            Buy Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;