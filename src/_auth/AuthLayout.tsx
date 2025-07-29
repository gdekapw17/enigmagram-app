import { Outlet, Navigate } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import AppLoader from '@/components/shared/AppLoader';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();

  // 1. Tampilkan loader selama pengecekan berlangsung
  if (isLoading) {
    return (
      <div className="flex-center w-full h-screen">
        <AppLoader />
      </div>
    );
  }

  // 2. Jika sudah tidak loading DAN sudah login, alihkan dari halaman ini
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  // 3. Jika sudah tidak loading DAN tidak login, tampilkan halaman sign-in/up
  return (
    <>
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <Outlet />
      </section>
      <img
        src="/assets/images/side-img.svg"
        alt="logo"
        className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
      />
    </>
  );
};

export default AuthLayout;
