import SiteNav from './SiteNav'
import SiteFooter from './SiteFooter'

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col">
      <SiteNav />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
