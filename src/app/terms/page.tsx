import SharedLayout from "@/components/shared-layout";

export default function TermsPage() {
  return (
    <SharedLayout
      pageType="terms"
      showHeader={true}
      uploadHref="/upload"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-headline mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this keepsake sharing platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">2. Description of Service</h2>
            <p>
              This is a personal project created as a birthday gift. The platform allows anyone to share photos, videos, and text keepsakes. Users can upload content and view all shared keepsakes. This is not a commercial service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">3. Public Access and Content Visibility</h2>
            <p>
              <strong>Important:</strong> This platform is designed for public sharing. Anyone can:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload content without any authentication or registration</li>
              <li>Access and view all uploaded content from the storage bucket</li>
              <li>Download or copy any uploaded content</li>
              <li>Share links to uploaded content</li>
            </ul>
            <p className="mt-4">
              <strong>Do not upload any content that you want to keep private or confidential.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">4. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for all content you upload and share</li>
              <li>You must not upload content that is illegal, harmful, threatening, abusive, or violates others' rights</li>
              <li>You must not upload content that contains personal information of others without their consent</li>
              <li>You must not upload copyrighted material without permission</li>
              <li>You understand that all content becomes publicly accessible</li>
              <li>You must not upload sensitive, private, or confidential information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">5. Content Ownership and License</h2>
            <p>
              You retain ownership of the content you upload. By uploading content, you grant a non-exclusive, worldwide, royalty-free license to store, display, and distribute your content as part of this public sharing platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">6. Data Storage and Privacy</h2>
            <p>
              <strong>Critical Information:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All uploaded content is stored in publicly accessible storage buckets</li>
              <li>Anyone with technical knowledge can access all uploaded content directly</li>
              <li>There are no access controls or privacy protections</li>
              <li>Content may be indexed by search engines or discovered by others</li>
              <li>We cannot guarantee the privacy or security of any uploaded content</li>
              <li>Do not upload anything you would not want to be publicly visible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">7. Analytics and Tracking</h2>
            <p>
              This platform uses Google Analytics to collect anonymous usage data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages visited and navigation patterns</li>
              <li>Time spent on different pages</li>
              <li>Browser and device information</li>
              <li>General location data (country/region level)</li>
              <li>Referral sources and traffic patterns</li>
            </ul>
            <p className="mt-4">
              This analytics data helps us understand how the platform is used and improve the user experience. The data is collected anonymously and does not identify individual users or their uploaded content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">8. Service Availability</h2>
            <p>
              This is a personal project with no guarantees of service availability. The service may be modified, suspended, or discontinued at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">9. Limitation of Liability</h2>
            <p>
              This is a personal project created as a birthday gift. We are not liable for any damages arising from the use of this service, including but not limited to data loss, content misuse, privacy violations, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">11. Contact Information</h2>
            <p>
              This is a personal project created by Ben Wilson. If you have questions about these terms, please contact the creator through the platform.
            </p>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
}
