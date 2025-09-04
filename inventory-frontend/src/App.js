import React, { useState, useEffect } from "react";
import ProductForm from "./components/ProductForm";
import Dashboard from "./components/Dashboard";
import { listProducts, createProduct, updateProduct, deleteProduct } from "./services/api";

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = async () => {
    const { data } = await listProducts();
    setItems(data);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSubmitForm = async (formData, id) => {
    if (id) {
      await updateProduct(id, formData);
    } else {
      await createProduct(formData);
    }
    await loadProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
    await loadProducts();
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🧾 Inventory Dashboard</h1>

      <ProductForm
        onSubmitForm={handleSubmitForm}
        selectedProduct={selectedProduct}
        clearSelection={() => setSelectedProduct(null)}
      />

      <Dashboard
        items={items}
        onDelete={handleDelete}
        onEdit={setSelectedProduct}
      />
    </div>
  );
}
