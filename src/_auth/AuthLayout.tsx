import { useUserContext } from '@/context/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';

const AuthLayout = () => {
  // ✅ Ambil status otentikasi dari context, bukan hardcode
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        // Jika sudah login, alihkan ke halaman utama
        <Navigate to="/" />
      ) : (
        // Jika belum, tampilkan halaman sign-in/sign-up beserta gambar
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
      )}
    </>
  );
};

export default AuthLayout;
