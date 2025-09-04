import React, { useState, useEffect } from "react";

export default function ProductForm({ onSubmitForm, selectedProduct, clearSelection }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name);
      setQuantity(selectedProduct.quantity);
      setPrice(selectedProduct.price);
      setImage(null);
    } else {
      setName(""); setQuantity(""); setPrice(""); setImage(null);
    }
  }, [selectedProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("quantity", quantity);
      fd.append("price", price);
      if (image) fd.append("image", image);

      await onSubmitForm(fd, selectedProduct?.id);

      // Reset form
      setName(""); setQuantity(""); setPrice(""); setImage(null);
      if (clearSelection) clearSelection();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 mb-6 bg-white p-6 rounded-lg shadow-md">
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0] || null)}
        className="border rounded px-3 py-2"
      />
      <button
        disabled={busy}
        type="submit"
        className={`px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {busy ? (selectedProduct ? "Updating..." : "Saving...") : (selectedProduct ? "Update Product" : "Add Product")}
      </button>
    </form>
  );
}
