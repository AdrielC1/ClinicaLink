import { Nunito } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata = {
  title: "ClinicaLink",
  description: "ClinicaLink | Smart Clinic Appointment System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full antialiased scroll-smooth scroll-pt-16 ${nunito.variable}`}
    >
      <body className={`min-h-full flex flex-col ${nunito.className}`}>
        <Script id="role-guard" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
          (function() {
            var ROLE_PREFIXES = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
            function checkRole() {
              var path = window.location.pathname;
              var role = localStorage.getItem('clinicalink:role');
              if (!role) return;
              var isProtected = path.startsWith('/admin') || path.startsWith('/doctor') || path.startsWith('/patient');
              if (!isProtected) return;
              var allowed = ROLE_PREFIXES[role];
              if (allowed && !path.startsWith(allowed)) {
                window.location.replace(allowed + '/dashboard');
              }
            }
            // Cek saat halaman dimuat (termasuk dari BFCache)
            window.addEventListener('pageshow', function() { checkRole(); });
            // Cek setiap 300ms untuk menangkap Next.js Router Cache restoration
            setInterval(checkRole, 300);
          })();
        `}} />
        {children}
      </body>
    </html>
  );
}
