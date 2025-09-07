import SharedLayout from "@/components/shared-layout";

export default function PrivacyPage() {
  return (
    <SharedLayout
      pageType="privacy"
      showHeader={true}
      uploadHref="/upload"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-headline mb-4">1. About This Project</h2>
            <p>
              This is a personal project created by Ben Wilson as a birthday gift. It is not a commercial service and has no formal privacy protections or data controls.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">2. Information Collection</h2>
            <p>
              This platform collects and stores:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content you upload (photos, videos, text)</li>
              <li>Names you provide when uploading content</li>
              <li>Any other information you choose to share</li>
            </ul>
            <p className="mt-4">
              <strong>No authentication or registration is required.</strong> Anyone can upload content anonymously.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">3. How Information Is Used</h2>
            <p>
              All uploaded content is:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Displayed publicly on the platform</li>
              <li>Stored in publicly accessible storage buckets</li>
              <li>Available for anyone to view, download, or share</li>
              <li>Not protected by any privacy controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">4. Critical Privacy Information</h2>
            <p>
              <strong>IMPORTANT WARNING:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>All content is publicly accessible</strong> - Anyone can access all uploaded content</li>
              <li><strong>No privacy controls</strong> - There are no restrictions on who can view content</li>
              <li><strong>Direct bucket access</strong> - Anyone with technical knowledge can access the storage bucket directly</li>
              <li><strong>Search engine indexing</strong> - Content may be discovered by search engines</li>
              <li><strong>No data protection</strong> - We cannot guarantee the privacy or security of any content</li>
              <li><strong>Permanent public sharing</strong> - Once uploaded, content becomes permanently public</li>
            </ul>
            <p className="mt-4 font-bold text-destructive">
              DO NOT UPLOAD ANY CONTENT THAT YOU WANT TO KEEP PRIVATE OR CONFIDENTIAL.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">5. Information Sharing</h2>
            <p>
              All uploaded content is automatically shared with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Anyone who visits the platform</li>
              <li>Anyone who accesses the storage bucket directly</li>
              <li>Search engines and web crawlers</li>
              <li>Anyone who shares links to the content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">6. Data Retention</h2>
            <p>
              This is a personal project with no formal data retention policies. Content may be retained indefinitely or removed at the creator's discretion. There are no guarantees about how long content will be stored.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">7. Your Rights</h2>
            <p>
              As this is a personal project with no formal privacy controls:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can view content you have uploaded</li>
              <li>You can request content deletion (though this is not guaranteed)</li>
              <li>You have no formal privacy rights or data protection</li>
              <li>Once uploaded, content becomes permanently public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">8. Third-Party Services</h2>
            <p>
              This platform uses third-party services for storage and hosting. These services have their own privacy policies and data practices that are beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">9. Analytics and Tracking</h2>
            <p>
              This platform uses Google Analytics (GA4) to collect anonymous usage data. Google Analytics helps us understand how the platform is used and improve the user experience.
            </p>
            <p className="mt-4">
              <strong>What Google Analytics collects:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages visited and navigation patterns</li>
              <li>Time spent on different pages</li>
              <li>Browser type and version</li>
              <li>Device type and screen resolution</li>
              <li>General location (country/region level only)</li>
              <li>Referral sources (how users found the platform)</li>
              <li>User interactions and engagement metrics</li>
            </ul>
            <p className="mt-4">
              <strong>Important notes about analytics:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analytics data is collected anonymously and does not identify individual users</li>
              <li>No personal information or uploaded content is tracked by analytics</li>
              <li>Google Analytics data is stored by Google and subject to their privacy policy</li>
              <li>You can opt out of Google Analytics tracking using browser extensions or settings</li>
              <li>Analytics data is used solely to improve the platform's functionality and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">10. Children's Privacy</h2>
            <p>
              This platform is not intended for children under 13. Due to the public nature of the platform, we strongly discourage uploading content featuring children or personal information about minors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">11. Changes to This Policy</h2>
            <p>
              As a personal project, this privacy policy may be updated at any time without notice. Continued use of the platform constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline mb-4">12. Contact Information</h2>
            <p>
              This is a personal project created by Ben Wilson. If you have questions about privacy or data practices, please contact the creator through the platform.
            </p>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
}
