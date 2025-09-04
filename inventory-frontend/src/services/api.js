import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

export const listProducts = () => API.get("/products");

export const createProduct = (formData) =>
  API.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
export const updateProduct = (id, formData) =>
  API.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const deleteProduct = (id) => API.delete(`/products/${id}`);
