import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./App.css";
import {
  askQuestion,
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "./api";
import type { Document, DocumentInput } from "./api";

type View = "list" | "create" | "edit" | "view";

interface FormErrors {
  title?: string;
  content?: string;
}

function validateForm(values: DocumentInput): FormErrors {
  const errors: FormErrors = {};
  if (!values.title.trim()) errors.title = "Title is required";
  if (!values.content.trim()) errors.content = "Content is required";
  return errors;
}

function DocumentForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: DocumentInput;
  submitLabel: string;
  onSubmit: (input: DocumentInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<DocumentInput>(
    initialValues ?? { title: "", content: "", category: "" },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange =
    (field: keyof DocumentInput) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      console.log(values, "ye form submit ho rha h");
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category.trim(),
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="document-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={handleChange("title")}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={values.category}
          onChange={handleChange("category")}
        />
      </div>

      <div className="form-field">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          rows={8}
          value={values.content}
          onChange={handleChange("content")}
          aria-invalid={Boolean(errors.content)}
        />
        {errors.content && (
          <span className="field-error">{errors.content}</span>
        )}
      </div>

      {submitError && <div className="form-error">{submitError}</div>}

      <div className="form-actions">
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={submitting}
        >
          Back
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function AskAi({ documentId }: { documentId: string }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setStatus("loading");
    setError("");
    try {
      console.log(question, "ye question ja rha h backend me");
      const result = await askQuestion(documentId, question.trim());
      console.log(result, "ai ka answer frontend pe aaya");
      setAnswer(result);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div className="ask-ai mb-4">
      <form onSubmit={handleAsk} className="ask-ai-form mb-4">
        <input
          type="text"
          placeholder="Ask a question about this document..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "Asking..." : "Ask"}
        </button>
      </form>

      {status === "error" && <p className="form-error">{error}</p>}
      {status === "success" && (
        <>
         Ai Reply: {answer}
          </>
      )}
    </div>
  );
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<Document | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listDocuments({
        search: search || undefined,
        category: category || undefined,
      });
      console.log(data.length, "documents aaye frontend pe");
      setDocuments(data);
    } catch {
      setLoadError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timeout = setTimeout(refresh, 250);
    return () => clearTimeout(timeout);
  }, [refresh]);

  const categories = useMemo(() => {
    const unique = new Set(documents.map((d) => d.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [documents]);

  const handleCreate = async (input: DocumentInput) => {
    await createDocument(input);
    setView("list");
    await refresh();
  };

  const handleUpdate = async (input: DocumentInput) => {
    if (!selected) return;
    const updated = await updateDocument(selected._id, input);
    setSelected(updated);
    setView("view");
    await refresh();
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    console.log(pendingDelete._id, "isko delete krne ja rhe h");
    await deleteDocument(pendingDelete._id);
    setPendingDelete(null);
    if (selected?._id === pendingDelete._id) {
      setSelected(null);
      setView("list");
    }
    await refresh();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Documents</h1>
        {view === "list" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setView("create")}
          >
            New Document
          </button>
        )}
      </header>

      {view === "list" && (
        <>
          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Search by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {loadError && <p className="form-error">{loadError}</p>}

          {loading ? (
            <p className="status-text">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="status-text">No documents found.</p>
          ) : (
            <ul className="document-list">
              {documents.map((doc) => (
                <li key={doc._id} className="document-card">
                  <div
                    className="document-card-main"
                    onClick={() => {
                      setSelected(doc);
                      setView("view");
                    }}
                  >
                    <h3>{doc.title}</h3>
                    {doc.category && (
                      <span className="category-badge">{doc.category}</span>
                    )}
                    <p className="document-preview">{doc.content}</p>
                  </div>
                  <div className="document-card-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setSelected(doc);
                        setView("view");
                      }}
                    >
                      Detail page
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setSelected(doc);
                        setView("edit");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setPendingDelete(doc)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === "create" && (
        <DocumentForm
          submitLabel="Create"
          onSubmit={handleCreate}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && selected && (
        <DocumentForm
          submitLabel="Save"
          initialValues={{
            title: selected.title,
            content: selected.content,
            category: selected.category,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setView("view")}
        />
      )}

      {view === "view" && selected && (
        <div className="document-detail">
          <button
            type="button"
            className="btn btn-link"
            onClick={() => setView("list")}
          >
            &larr; Back to list
          </button>
          <h2>{selected.title}</h2>
          {selected.category && (
            <span className="category-badge">{selected.category}</span>
          )}
          <p className="document-content">{selected.content}</p>

          <AskAi documentId={selected._id} />

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setView("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setPendingDelete(selected)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="dialog-overlay" role="dialog" aria-modal="true">
          <div className="dialog-box">
            <p>Are you sure to Delete it </p>
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirmed}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
