import { FaqSection } from './components/faq-section';
import { FeatureSection } from './components/feature-section';
import { HeroSection } from './components/hero-section';
import { InstallSection } from './components/install-section';
import { ShowcaseSection } from './components/showcase/showcase-section';
import { SiteFooter } from './components/site-footer';
import { SiteHeader } from './components/site-header';

// 落地页组装：自上而下排列各区块
export function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6">
      <SiteHeader />
      <HeroSection />
      <ShowcaseSection />
      <FeatureSection />
      <InstallSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
