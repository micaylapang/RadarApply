const FAQS = [
  {
    q: "How does RadarApply work?",
    a: "Pick the companies and roles you want to watch, opt in to SMS, and we monitor those careers pages on a one-minute loop. The second a listing flips open, you get a text — not an email buried in your inbox.",
  },
  {
    q: "How fast are the alerts?",
    a: "We check job boards and company pages about every 60 seconds and send SMS within seconds of a relevant opening. Since early applicants get reviewed first, we want to maximize your chances.",
  },
  {
    q: "Which companies can I track?",
    a: "You choose from curated watches across FAANG, startups, and other high-demand employers. More roles get added as we expand coverage.",
  },
  {
    q: "Will I get spam texts?",
    a: "No. You only get alerts for the positions you selected when they actually open. No marketing blasts, promo drops, or unrelated noise.",
  },
  {
    q: "How do I stop texts?",
    a: "Reply STOP at any time to unsubscribe. Reply HELP for customer support. After STOP you get one confirmation message and no further texts unless you opt in again. Full details are on our Terms and Privacy pages.",
  },
  {
    q: "How is this different from LinkedIn or company emails?",
    a: "LinkedIn often posts jobs that have already been live for days, and most companies don’t send reliable email alerts. RadarApply watches the source careers page and texts you as soon as the role opens.",
  },
] as const;

export function FaqSection() {
  return (
    <section className="section faq" id="faq">
      <div className="faq-head">
        <p className="about-kicker">FAQ</p>
        <h2>Frequently Asked Questions</h2>
      </div>

      <div className="faq-list">
        {FAQS.map((item) => (
          <details key={item.q} className="faq-item">
            <summary className="faq-question">
              <span>{item.q}</span>
              <span className="faq-icon" aria-hidden="true" />
            </summary>
            <p className="faq-answer">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
