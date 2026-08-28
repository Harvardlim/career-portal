import { createBrowserRouter } from 'react-router-dom'
import { SiteLayout } from './layouts/SiteLayout'
import { HomePage } from './pages/HomePage'
import { CreateAccountPage } from './pages/auth/CreateAccountPage'
import { SignInPage } from './pages/auth/SignInPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { FindJobPage } from './pages/FindJobPage'
import { FindJobListPage } from './pages/FindJobListPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { ApplyJobPage } from './pages/ApplyJobPage'
import { BrowseEmployerPage } from './pages/BrowseEmployerPage'
import { EmployerDetailPage } from './pages/EmployerDetailPage'
import { BrowseCandidatePage } from './pages/BrowseCandidatePage'
import { SendEmailPage } from './pages/SendEmailPage'
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage'
import { AppliedJobsPage } from './pages/dashboard/AppliedJobsPage'
import { FavoriteJobsPage } from './pages/dashboard/FavoriteJobsPage'
import { JobAlertsPage } from './pages/dashboard/JobAlertsPage'
import { SettingsPage } from './pages/dashboard/SettingsPage'
import {
  CompanyInfoStep,
  FoundingInfoStep,
  CompanySocialStep,
  CompanyContactStep,
  CompanyRegisterSuccess,
} from './pages/company/CompanyRegisterPages'
import { EmployerDashboardPage } from './pages/employer/EmployerDashboardPage'
import { PostJobPage } from './pages/employer/PostJobPage'
import { MyJobsPage } from './pages/employer/MyJobsPage'
import { PostJobPricingPage } from './pages/employer/PostJobPricingPage'
import { CheckoutPage } from './pages/employer/CheckoutPage'
import { JobApplicationsPage } from './pages/employer/JobApplicationsPage'
import { SingleApplicantPage } from './pages/employer/SingleApplicantPage'
import { SavedCandidatesPage } from './pages/employer/SavedCandidatesPage'
import { PlansBillingPage } from './pages/employer/PlansBillingPage'
import {
  AddColumnPage,
  PostJobSuccessPage,
  PromoteJobPage,
} from './pages/employer/EmployerModals'
import { BlogPage } from './pages/BlogPage'
import { SingleBlogPage } from './pages/SingleBlogPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { FaqPage } from './pages/FaqPage'
import { TermsPage } from './pages/TermsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ComingSoonPage } from './pages/ComingSoonPage'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/post', element: <SingleBlogPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/coming-soon', element: <ComingSoonPage /> },
  { path: '/create-account', element: <CreateAccountPage /> },
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/email-verification', element: <EmailVerificationPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/find-job', element: <FindJobPage /> },
  { path: '/find-job-list', element: <FindJobListPage /> },
  { path: '/find-job-filter', element: <FindJobPage filterOpen /> },
  { path: '/job-detail', element: <JobDetailPage /> },
  { path: '/apply-job', element: <ApplyJobPage /> },
  { path: '/browse-employer', element: <BrowseEmployerPage /> },
  { path: '/employer-detail', element: <EmployerDetailPage /> },
  { path: '/browse-candidate', element: <BrowseCandidatePage /> },
  { path: '/send-email', element: <SendEmailPage /> },
  { path: '/dashboard', element: <DashboardOverviewPage /> },
  { path: '/dashboard/applied-jobs', element: <AppliedJobsPage /> },
  { path: '/dashboard/favorite-jobs', element: <FavoriteJobsPage /> },
  { path: '/dashboard/job-alerts', element: <JobAlertsPage /> },
  { path: '/dashboard/settings', element: <SettingsPage tab="personal" /> },
  { path: '/dashboard/settings/profile', element: <SettingsPage tab="profile" /> },
  { path: '/dashboard/settings/social', element: <SettingsPage tab="social" /> },
  { path: '/dashboard/settings/account', element: <SettingsPage tab="account" /> },

  { path: '/company/register', element: <CompanyInfoStep /> },
  { path: '/company/register/founding', element: <FoundingInfoStep /> },
  { path: '/company/register/social', element: <CompanySocialStep /> },
  { path: '/company/register/contact', element: <CompanyContactStep /> },
  { path: '/company/register/success', element: <CompanyRegisterSuccess /> },

  { path: '/employer/dashboard', element: <EmployerDashboardPage /> },
  { path: '/employer/post-job', element: <PostJobPage /> },
  { path: '/employer/post-job/success', element: <PostJobSuccessPage /> },
  { path: '/employer/my-jobs', element: <MyJobsPage /> },
  { path: '/employer/my-jobs/promote', element: <PromoteJobPage /> },
  { path: '/employer/pricing', element: <PostJobPricingPage /> },
  { path: '/employer/checkout', element: <CheckoutPage /> },
  { path: '/employer/applications', element: <JobApplicationsPage /> },
  { path: '/employer/applications/applicant', element: <SingleApplicantPage /> },
  { path: '/employer/applications/add-column', element: <AddColumnPage /> },
  { path: '/employer/saved-candidates', element: <SavedCandidatesPage /> },
  { path: '/employer/billing', element: <PlansBillingPage /> },
])
