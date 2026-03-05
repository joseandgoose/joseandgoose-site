"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Combine first and last name for API
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {success && (
        <div className="form-message form-message--success">
          Thanks for reaching out! I'll get back to you soon.
        </div>
      )}

      {error && (
        <div className="form-message form-message--error">
          {error}
        </div>
      )}

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            minLength={2}
            maxLength={50}
            disabled={loading}
            placeholder="First name"
          />
        </div>

        <div className="form-field">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            minLength={2}
            maxLength={50}
            disabled={loading}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
          placeholder="your.email@example.com"
        />
      </div>

      <div className="form-field">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          minLength={10}
          maxLength={1000}
          rows={6}
          disabled={loading}
          placeholder="What's on your mind?"
        />
      </div>

      <div className="form-meta">
        <div className="form-required">* REQUIRED FIELD</div>
        <span className="form-hint">
          {formData.message.length}/1000 characters
        </span>
      </div>

      <button
        type="submit"
        className="btn btn-fill btn-centered"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
