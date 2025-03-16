import React from "react";

const Download: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 "
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Download</h2>
        <p>This is the body of the modal.</p>
      </div>
    </div>
  );
};

export default Download;
