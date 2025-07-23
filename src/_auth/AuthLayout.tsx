import { Outlet, Navigate } from 'react-router-dom';

const AuthLayout = () => {
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <section className="flex-center flex-1 flex-col py-10">
        <Outlet />
      </section>

      <img
        src="/assets/images/side-img.svg"
        alt="side-img"
        className="hidden xl:block h-screen w-1/2 object-cover"
      />
    </>
  );
};

export default AuthLayout;
