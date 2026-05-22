import "./globals.css";

export const metadata = {
  title: "ClinicaLink",
  description: "ClinicaLink | Smart Clinic Appointment System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth scroll-pt-16"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
