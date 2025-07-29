import { useUserContext } from '@/context/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';
import { Topbar, LeftSidebar, Bottombar, AppLoader } from '@/components/shared';

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();

  if (isLoading) {
    return (
      <div className="flex-center h-screen w-full">
        <AppLoader />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <div className="w-full md:flex">
          <Topbar />
          <LeftSidebar />

          <section className="flex flex-1 h-full">
            <Outlet />
          </section>

          <Bottombar />
        </div>
      </>
    );
  }

  return <Navigate to="/sign-in" />;
};
export default RootLayout;
