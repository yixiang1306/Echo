import React from "react";

interface UpdateAccModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const UpdateAccModal: React.FC<UpdateAccModalProps> = ({
  title,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Update {title}</h2>
        <p className="mb-6">Are you sure you want to update your {title}?</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Yes
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

export default UpdateAccModal;
