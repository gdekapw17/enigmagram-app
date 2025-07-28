import { useUserContext } from '@/context/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';
import { Topbar, LeftSidebar, Bottombar } from '@/components/shared';

const RootLayout = () => {
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        // Jika sudah login, tampilkan halaman privat
        <div className="w-full md:flex">
          <Topbar />
          <LeftSidebar />

          <section className="flex flex-1 h-full">
            <Outlet />
          </section>

          <Bottombar />
        </div>
      ) : (
        // Jika belum login, paksa ke halaman sign-in
        <Navigate to="/sign-in" />
      )}
    </>
  );
};
export default RootLayout;
