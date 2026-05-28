import { Inter, Plus_Jakarta_Sans, Poppins, Nunito, Outfit, Quicksand } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });
const poppins = Poppins({ weight: ["400", "600", "700", "800"], subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });

export default function FontsDemoPage() {
  const fonts = [
    { name: "Inter", className: inter.className, description: "Bersih, modern, dan sangat profesional. Font standar UI modern masa kini (dipakai GitHub, Tailwind, dll)." },
    { name: "Plus Jakarta Sans", className: jakarta.className, description: "Agak lebar, sangat estetik dan modern. Cocok untuk dashboard yang terlihat premium." },
    { name: "Poppins", className: poppins.className, description: "Geometris dan bulat. Memberikan kesan ramah, bersahabat, dan modern." },
    { name: "Nunito", className: nunito.className, description: "Sangat bulat dan lembut. Sangat populer untuk aplikasi kesehatan/medis karena terasa menenangkan." },
    { name: "Outfit", className: outfit.className, description: "Perpaduan geometris modern dengan sentuhan elegan." },
    { name: "Quicksand", className: quicksand.className, description: "Lebih santai, ramping, dan ramah." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pilihan Font ClinicaLink</h1>
          <p className="text-slate-500">Bandingkan berbagai font modern di bawah ini. Mana yang paling Anda suka?</p>
        </div>

        {fonts.map((font) => (
          <div key={font.name} className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-200 ${font.className}`}>
            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest">{font.name}</span>
              <p className="text-sm text-slate-500 mt-1">{font.description}</p>
            </div>
            
            <div className="space-y-6">
              {/* Contoh Judul Besar */}
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Riwayat Konsultasi</h1>
                <p className="text-slate-500 text-sm">Lihat seluruh riwayat konsultasi dan daftar janji temu Anda.</p>
              </div>

              {/* Contoh Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 mb-1">Total Konsultasi</p>
                  <p className="text-2xl font-black text-slate-900">12</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 mb-1">Janji Temu Selesai</p>
                  <p className="text-2xl font-black text-slate-900">10</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 mb-1">Status</p>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">Selesai</span>
                </div>
              </div>

              {/* Contoh Text Panjang */}
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700">
                Dr. Emily adalah dokter spesialis yang berdedikasi tinggi dengan pengalaman lebih dari 10 tahun di bidangnya. 
                Memiliki pendekatan yang ramah dan menenangkan terhadap pasien.
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
