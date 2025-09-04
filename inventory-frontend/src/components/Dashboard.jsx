import React from "react";

export default function Dashboard({ items, onDelete, onEdit }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Products</h2>
      <div className="grid gap-4">
        {items.length === 0 && <div className="text-gray-500">No products yet.</div>}
        {items.map((p) => (
          <div key={p.id} className="flex gap-4 p-4 border rounded-lg shadow-sm bg-white">
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-gray-600">Qty: {p.quantity} | Price: ${p.price}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onEdit(p)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
