import React from "react";

interface DeleteAccModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteAccModal: React.FC<DeleteAccModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Account</h2>
        <p className="mb-6">
          Are you sure you want to delete your account? This action cannot be
          undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, Delete
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccModal;
