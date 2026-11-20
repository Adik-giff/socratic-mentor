import './globals.css';

export const metadata = {
  title: 'Socratic & Lecture AI — Образовательная платформа',
  description: 'Интеллектуальная образовательная платформа: Сократический ментор по коду и Конвертер лекций по методу Фейнмана',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
