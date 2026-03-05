import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <>
      {/* ── CONTACT SECTION ── */}
      <section className="contact-section">
        <h1 className="contact-page-title">Contact</h1>

        <div className="contact-form-wrap">
          <p className="contact-intro">Get in touch</p>
          <ul className="contact-reasons">
            <li>Consulting inquiries</li>
            <li>Project recommendations</li>
            <li>Book time to chat</li>
          </ul>
          <ContactForm />
        </div>
      </section>
    </>
  );
}