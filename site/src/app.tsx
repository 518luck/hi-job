import { FeatureSection } from './components/feature-section';
import { HeroSection } from './components/hero-section';
import { ScreenshotSection } from './components/screenshot-section';
import { SiteHeader } from './components/site-header';

// 落地页组装：自上而下排列各区块
export function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      <SiteHeader />
      <HeroSection />
      <FeatureSection />
      <ScreenshotSection />
    </main>
  );
}
