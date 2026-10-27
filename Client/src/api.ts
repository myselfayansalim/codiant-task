import axios from "axios";

export interface Document {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInput {
  title: string;
  content: string;
  category: string;
}

interface ListParams {
  search?: string;
  category?: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

export const listDocuments = async (params: ListParams): Promise<Document[]> => {
  const { data } = await api.get<Document[]>("/documents", { params });
  return data;
};

export const createDocument = async (input: DocumentInput): Promise<Document> => {
  const { data } = await api.post<Document>("/documents", input);
  return data;
};

export const updateDocument = async (id: string, input: DocumentInput): Promise<Document> => {
  const { data } = await api.put<Document>(`/documents/${id}`, input);
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const askQuestion = async (documentId: string, question: string): Promise<string> => {
  const { data } = await api.post<{ answer: string }>("/ai/ask", { documentId, question });
  return data.answer;
};
