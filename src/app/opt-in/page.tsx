export default function OptInPage() {
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
        <p className="legal-kicker">SMS program</p>
        <h1>Opt-in consent</h1>
        <p className="legal-updated">
          Public evidence of RadarApply&apos;s SMS opt-in flow for A2P 10DLC
          review. Live enrollment:{" "}
          <a href="https://www.radarapply.com/signup">
            https://www.radarapply.com/signup
          </a>
          .
        </p>

        <h2>How end users opt in (Call to Action / Message Flow)</h2>
        <ol>
          <li>
            Visit{" "}
            <a href="https://www.radarapply.com/signup">
              https://www.radarapply.com/signup
            </a>
            .
          </li>
          <li>Choose a company and the internship/job positions to track.</li>
          <li>Enter name and mobile phone number.</li>
          <li>
            Actively check the unchecked SMS consent checkbox (never pre-checked)
            that contains the consent language below.
          </li>
          <li>Submit the form by clicking &quot;Start Tracking&quot;.</li>
        </ol>
        <p>
          Only users who complete this flow and check the consent box receive
          RadarApply SMS alerts. Consent is not a condition of purchase.
        </p>

        <h2>Consent language shown next to the unchecked checkbox</h2>
        <div className="sms-consent opt-in-demo">
          <p className="sms-consent-lead">
            RadarApply is an SMS alert program for internship and job
            application openings you choose to track.
          </p>

          <label className="consent-check">
            <input type="checkbox" disabled aria-checked="false" />
            <span>
              I agree to receive automated SMS notifications from RadarApply at
              the mobile number provided about internship application alerts for
              tracked internship applications I choose to monitor (including
              company, role title, and apply link), plus optional test messages
              if I request them. Message frequency varies depending on the
              internships and job opportunities I choose to track and when those
              applications become available. Message and data rates may apply.
              Reply STOP at any time to unsubscribe. Reply HELP for customer
              support. Consent to receive SMS messages is not a condition of
              purchase. Terms:{" "}
              <a
                href="https://www.radarapply.com/terms"
                target="_blank"
                rel="noreferrer"
              >
                https://www.radarapply.com/terms
              </a>
              . Privacy:{" "}
              <a
                href="https://www.radarapply.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                https://www.radarapply.com/privacy
              </a>
              .
            </span>
          </label>
        </div>

        <h2>Required disclosures (all on the checkbox)</h2>
        <ul>
          <li>
            <strong>Message type:</strong> automated SMS notifications /
            internship application alerts for tracked internship applications
          </li>
          <li>
            <strong>Frequency:</strong> Message frequency varies depending on
            tracked internships and when applications become available
          </li>
          <li>
            <strong>Rates:</strong> Message and data rates may apply
          </li>
          <li>
            <strong>Opt-out / help:</strong> Reply STOP at any time to
            unsubscribe. Reply HELP for customer support.
          </li>
        </ul>

        <h2>Related links</h2>
        <ul>
          <li>
            Signup:{" "}
            <a href="https://www.radarapply.com/signup">
              https://www.radarapply.com/signup
            </a>
          </li>
          <li>
            Terms:{" "}
            <a href="https://www.radarapply.com/terms">
              https://www.radarapply.com/terms
            </a>
          </li>
          <li>
            Privacy:{" "}
            <a href="https://www.radarapply.com/privacy">
              https://www.radarapply.com/privacy
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
