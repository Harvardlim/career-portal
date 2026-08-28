import { HeroSection } from '@/components/home/HeroSection'
import { StatsSection } from '@/components/home/StatsSection'
import { VacanciesSection } from '@/components/home/VacanciesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { FeaturedJobsSection } from '@/components/home/FeaturedJobsSection'
import { TopCompaniesSection } from '@/components/home/TopCompaniesSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { CtaSection } from '@/components/home/CtaSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <VacanciesSection />
      <HowItWorksSection />
      <CategoriesSection />
      <FeaturedJobsSection />
      <TopCompaniesSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  )
}
