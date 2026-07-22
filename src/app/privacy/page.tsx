export default function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 19, 2026</p>

        <p>
          This Privacy Policy explains how RadarApply (“we,” “us”) collects,
          uses, and shares information when you use{" "}
          <a href="https://www.radarapply.com">https://www.radarapply.com</a>{" "}
          and our SMS alert program.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> name and mobile phone number you
            provide at signup.
          </li>
          <li>
            <strong>Preferences:</strong> internship roles and companies you
            choose to track.
          </li>
          <li>
            <strong>Message records:</strong> SMS delivery status and related
            logs needed to operate alerts.
          </li>
          <li>
            <strong>Technical data:</strong> basic server logs (e.g., IP
            address, timestamps) when you visit the site.
          </li>
        </ul>

        <h2>2. How we use information</h2>
        <ul>
          <li>
            To send internship application alerts (automated SMS notifications)
            you requested
          </li>
          <li>To operate, secure, and improve the Service</li>
          <li>
            To respond to HELP customer support requests and process STOP
            opt-outs
          </li>
          <li>To comply with legal and carrier messaging requirements</li>
        </ul>

        <h2>3. SMS program, message frequency, and rates</h2>
        <p>
          Users only receive automated SMS notifications after voluntarily
          providing their mobile phone number, selecting internship
          opportunities to monitor, actively checking the SMS consent checkbox
          (unchecked by default — not pre-selected), and submitting the signup
          form to enroll. These automated SMS notifications are internship
          application alerts that notify users when tracked internship
          applications become available for applications. Users may also
          expressly request an optional test message. Message frequency varies
          depending on the internships and job opportunities you choose to track
          and when those applications become available.{" "}
          <strong>Message and data rates may apply.</strong> Reply STOP at any
          time to unsubscribe. Reply HELP for customer support. Consent to
          receive SMS messages is not a condition of purchase.
        </p>
        <p>
          Users opt in by entering their mobile phone number, selecting
          internship opportunities to monitor, checking the SMS consent
          checkbox, and submitting the signup form.
        </p>

        <h2>4. Non-sharing of mobile numbers</h2>
        <p>
          Mobile phone numbers are never sold or shared for marketing or
          promotional purposes. SMS opt-in data and consent are never shared for
          marketing purposes. Mobile phone numbers may only be shared with
          trusted service providers when necessary to deliver the SMS messages
          requested by the user (for example, our SMS delivery provider). Your
          mobile phone number is used only to deliver RadarApply internship
          application alerts you requested and to process STOP / HELP requests.
        </p>

        <h2>5. Other sharing</h2>
        <p>
          We may use service providers solely to operate RadarApply (for
          example, hosting, database, and SMS delivery infrastructure). Those
          providers process information only to provide services to us and are
          not permitted to use your mobile number for their own marketing. We
          do not sell your personal information. We may disclose information if
          required by law.
        </p>

        <h2>6. Retention</h2>
        <p>
          We keep your information while your alert preferences are active and
          as needed for legitimate business, security, and legal purposes. After
          you opt out, we retain records as required to honor the opt-out and
          meet compliance obligations.
        </p>

        <h2>7. Security</h2>
        <p>
          We use reasonable administrative and technical safeguards. No method
          of transmission or storage is 100% secure.
        </p>

        <h2>8. Your choices</h2>
        <ul>
          <li>Reply STOP at any time to unsubscribe from SMS alerts</li>
          <li>Reply HELP for customer support</li>
          <li>
            After replying STOP, users receive one confirmation message and no
            additional SMS messages unless they opt in again
          </li>
          <li>
            Contact us at{" "}
            <a href="mailto:support@radarapply.com">support@radarapply.com</a>{" "}
            to request access or deletion where applicable
          </li>
        </ul>

        <h2>9. Children</h2>
        <p>
          The Service is not directed to children under 13, and we do not
          knowingly collect information from them.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update this Privacy Policy by posting a new version on this
          page with an updated date.
        </p>

        <h2>11. Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href="https://www.radarapply.com">https://www.radarapply.com</a>{" "}
          or{" "}
          <a href="mailto:support@radarapply.com">support@radarapply.com</a>.
        </p>

        <p>
          <a href="/terms">Terms and Conditions</a> ·{" "}
          <a href="/">Back to home</a>
        </p>
      </main>
    </div>
  );
}
