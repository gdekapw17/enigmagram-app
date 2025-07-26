import { useUserContext } from '@/context/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';

const RootLayout = () => {
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        // Jika sudah login, tampilkan halaman privat
        <Outlet />
      ) : (
        // Jika belum login, paksa ke halaman sign-in
        <Navigate to="/sign-in" />
      )}
    </>
  );
};
export default RootLayout;
