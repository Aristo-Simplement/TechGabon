import App from '@/components/App';

export const metadata = { alternates: { canonical: '/' } };

// Home page: pre-rendered once at build time (fast, and fully readable by search engines).
export default function HomePage() {
  return <App initialPath="/" />;
}
