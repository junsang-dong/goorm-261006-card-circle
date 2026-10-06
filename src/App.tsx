import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { InquiryListPage } from './features/inquiries/InquiryListPage'
import { InquiryThreadPage } from './features/inquiries/InquiryThreadPage'
import { BrowsePage } from './features/listings/BrowsePage'
import { ListingDetailPage } from './features/listings/ListingDetailPage'
import { ListingFormRoute } from './features/listings/ListingFormPage'
import { ProfilePage } from './features/profile/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/listings/new" element={<ListingFormRoute />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/listings/:id/edit" element={<ListingFormRoute />} />
        <Route path="/inquiries" element={<InquiryListPage />} />
        <Route path="/inquiries/:id" element={<InquiryThreadPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
