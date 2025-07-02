import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <header className="border-b bg-background dark:bg-gray-800">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t("translation.common.about")}</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            {t("translation.admin.backToHome")}
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-8 flex-grow">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h2>About BaazCine Reservation System</h2>
          
          <p>
            The BaazCine Reservation System is a sophisticated
            military-themed cinema booking platform designed specifically for
            military personnel and authorized civilians to reserve seats for movies
            and special screenings at the BaazCine theater.
          </p>
          
          <h3>Guidelines for Use</h3>
          
          <ul>
            <li>
              <strong>Authorized Users:</strong> This system is intended for use by
              military personnel, their families, and authorized civilian staff only.
            </li>
            <li>
              <strong>Account Credentials:</strong> Your account credentials are
              personal and should not be shared with others. Each user must have their
              own account.
            </li>
            <li>
              <strong>Reservation Limits:</strong> Standard users may reserve up to 4
              seats per event. Administrative users have no limit.
            </li>
            <li>
              <strong>Cancellation Policy:</strong> Reservations may be canceled at
              any time up to 30 minutes before the event starts. After this cutoff,
              cancellations must be handled by contacting an administrator.
            </li>
            <li>
              <strong>Past Events:</strong> The system does not allow reservations or
              modifications for events that have already occurred.
            </li>
          </ul>
          
          <h3>Fair Use Policy</h3>
          
          <p>
            To ensure fair access to all authorized personnel, we request that users
            adhere to the following principles:
          </p>
          
          <ol>
            <li>
              <strong>Responsible Booking:</strong> Only reserve seats you genuinely
              intend to use. Booking seats without the intention of attending prevents
              others from enjoying the event.
            </li>
            <li>
              <strong>Timely Cancellations:</strong> If you cannot attend an event,
              please cancel your reservation as soon as possible to make those seats
              available to others.
            </li>
            <li>
              <strong>Accurate Information:</strong> Provide accurate information when
              making reservations. This helps administrators manage the venue
              effectively.
            </li>
            <li>
              <strong>System Integrity:</strong> Do not attempt to circumvent system
              limitations or exploit technical vulnerabilities. Such actions are
              monitored and may result in account suspension.
            </li>
            <li>
              <strong>Administrative Oversight:</strong> Administrators reserve the
              right to modify or cancel reservations if necessary for operational,
              security, or maintenance reasons.
            </li>
          </ol>
          
          <h3>Security Notice</h3>
          
          <p>
            This reservation system operates within a secure military network
            infrastructure. All activities are logged and monitored for security
            purposes. The system employs encryption for all data transmissions and
            adheres to military-grade security standards for data protection.
          </p>
          
          <h3>Contact & Technical Support</h3>
          
          <p>
            For general inquiries, reservations, or technical assistance, 
            please contact us:
          </p>
          
          <ul>
            <li><strong>Email:</strong> support@militaryreservation.gov</li>
            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
            <li><strong>Hours:</strong> Monday-Friday, 0800-1700 Military Standard Time</li>
          </ul>
          
          <p>
            Our support team is available to assist with reservations, technical issues,
            or any questions about the BaazCine theater and upcoming movies.
          </p>
          
          <h3>System Development</h3>
          
          <p>
            The BaazCine Reservation System was developed using modern
            web technologies to provide a responsive, accessible, and secure
            platform for managing cinema reservations. The system features
            a React frontend with Tailwind CSS for responsive interfaces,
            a robust backend with secure authentication, and multilingual support.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}