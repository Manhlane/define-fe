import React from "react";

export default function TermsV1() {
  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: 19 February 2026 <br />
          Version: 1.0
        </p>

        <section className="space-y-6 text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p>
              Welcome to define! ("we", "us", "our"). By creating an account
              or using define!, you agree to these Terms of Service. If you do
              not agree, you may not use the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. What define! Does</h2>
            <p>
              define! provides a payment link platform that allows service
              providers (such as photographers and freelancers) to collect
              payments from clients before a service is delivered.
            </p>
            <p>
              define! may temporarily hold funds until delivery conditions
              are met or until an agreed auto-release period has passed.
              define! is not a bank. Payments are processed through third-party
              payment providers, including but not limited to Paystack.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Eligibility</h2>
            <p>To use define!, you must:</p>
            <ul className="list-disc pl-6">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and truthful information</li>
              <li>Use the platform lawfully</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that
              violate these conditions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Payments & Escrow</h2>
            <p>When a client makes payment through a define! payment link:</p>
            <ul className="list-disc pl-6">
              <li>Funds may be held temporarily</li>
              <li>Funds may be released after delivery or based on selected auto-release settings</li>
              <li>Funds may be delayed if a dispute is raised</li>
            </ul>
            <p>
              define! does not guarantee service quality, performance, or
              delivery outcomes. The service provider remains responsible for
              delivering the service as agreed with the client.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Fees</h2>
            <p>
              define! may charge a platform fee per transaction. Payment
              processors may charge additional processing fees.
            </p>
            <p>
              All applicable fees will be displayed before a transaction is
              completed. Fees may change with notice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Disputes</h2>
            <p>If a dispute is raised:</p>
            <ul className="list-disc pl-6">
              <li>Funds may be temporarily held</li>
              <li>Both parties may be asked to provide evidence</li>
              <li>define! may make a determination regarding fund release</li>
            </ul>
            <p>
              define!’s decision regarding fund release is final, subject to
              applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Refunds</h2>
            <p>Refunds may be issued:</p>
            <ul className="list-disc pl-6">
              <li>If both parties agree</li>
              <li>If a dispute is resolved in favor of the client</li>
              <li>If required by law</li>
            </ul>
            <p>
              Refund timelines depend on the payment provider’s processing times.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Account Suspension</h2>
            <p>We may suspend or terminate accounts that:</p>
            <ul className="list-disc pl-6">
              <li>Engage in fraudulent activity</li>
              <li>Attempt to bypass platform fees</li>
              <li>Violate applicable laws</li>
              <li>Abuse the dispute system</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9. Limitation of Liability</h2>
            <p>
              define! is not liable for indirect, incidental, or consequential
              damages, including but not limited to loss of income, missed
              bookings, or service disputes.
            </p>
            <p>
              define!’s total liability shall not exceed the total platform
              fees paid by the user in the preceding three (3) months.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">10. Data & Privacy</h2>
            <p>
              Your use of define! is also governed by our Privacy Policy.
              By using the platform, you consent to the collection and use of
              information as described therein.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. If material changes
              are made, users may be required to re-accept the updated Terms.
              Continued use of the platform constitutes acceptance of the
              updated Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of South Africa.
            </p>
          </div>
        </section>

        <div className="mt-12 text-sm text-gray-500">
          © {new Date().getFullYear()} define!. All rights reserved.
        </div>
      </div>
    </div>
  );
}
