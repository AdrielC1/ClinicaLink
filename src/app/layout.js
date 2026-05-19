import "./globals.css";

export const metadata = {
  title: "ClinicaLink",
  description: "ClinicaLink | Smart Clinic Appointment System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
