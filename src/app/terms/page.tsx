export default function TermsPage() {
  return (
    <div className="page legal-page">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="brand-fire" aria-hidden="true">
            🚨
          </span>
          <span className="brand-name">
            Radar<span>Apply</span>
          </span>
        </a>
        <a className="nav-pill" href="/signup">
          Start Tracking
        </a>
      </nav>

      <main className="legal">
        <p className="legal-kicker">Legal</p>
        <h1>Terms and Conditions</h1>
        <p className="legal-updated">Last updated: July 19, 2026</p>

        <p>
          These Terms and Conditions (“Terms”) govern your use of RadarApply
          (the “Service”) operated at{" "}
          <a href="https://www.radarapply.com">https://www.radarapply.com</a>.
          By using the Service or signing up for SMS alerts, you agree to these
          Terms.
        </p>

        <h2>1. The Service</h2>
        <p>
          RadarApply monitors selected internship listings and sends SMS alerts
          when applications for roles you choose to track become available for
          applications. We do not guarantee that every opening will be
          detected, that alerts will arrive instantly, or that any listing will
          remain open.
        </p>

        <h2>2. SMS program terms</h2>
        <p>
          By providing your mobile number and checking the SMS consent box on
          our signup form (unchecked by default), you expressly consent to
          receive automated SMS notifications from RadarApply about internship
          application alerts for tracked internship applications you choose to
          monitor (including company, role title, and apply link), plus optional
          user-requested test messages. Message frequency varies depending on
          the internships and job opportunities you choose to track and when
          those applications become available.{" "}
          <strong>Message and data rates may apply.</strong> Reply STOP at any
          time to unsubscribe. Reply HELP for customer support. After replying
          STOP, you will receive one final confirmation message confirming your
          opt-out. No additional SMS messages will be sent unless you opt in
          again. Carriers are not liable for delayed or undelivered messages.
          Consent to receive SMS messages is not a condition of purchase.
        </p>
        <p>
          Mobile phone numbers are never sold or shared for marketing or
          promotional purposes. SMS opt-in data and consent are never shared for
          marketing purposes. Mobile phone numbers may only be shared with
          trusted service providers when necessary to deliver the SMS messages
          requested by the user (for example, our SMS delivery provider).
        </p>

        <h2>3. Eligibility</h2>
        <p>
          You must be able to form a binding contract and provide a mobile
          number you own or control. You are responsible for the accuracy of
          information you submit.
        </p>

        <h2>4. Acceptable use</h2>
        <p>
          You may not use the Service for unlawful purposes, abuse our systems,
          or submit phone numbers without consent of the number holder.
        </p>

        <h2>5. Disclaimer</h2>
        <p>
          The Service is provided “as is” without warranties of any kind. We
          are not responsible for hiring decisions, internship availability, or
          third-party career board content.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, RadarApply will not be liable
          for indirect, incidental, special, consequential, or punitive damages,
          or any loss related to missed application windows or undelivered SMS.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may update these Terms by posting a revised version on this page.
          Continued use of the Service after changes means you accept the
          updated Terms.
        </p>

        <h2>8. SMS Support</h2>
        <p>
          For assistance with the RadarApply SMS alert program, reply HELP to
          any SMS message or contact{" "}
          <a href="mailto:support@radarapply.com">support@radarapply.com</a>.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about these Terms: visit{" "}
          <a href="https://www.radarapply.com">https://www.radarapply.com</a>{" "}
          or email{" "}
          <a href="mailto:support@radarapply.com">support@radarapply.com</a>.
        </p>

        <p>
          <a href="/privacy">Privacy Policy</a> · <a href="/">Back to home</a>
        </p>
      </main>
    </div>
  );
}
