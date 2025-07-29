import { Route, Routes } from 'react-router-dom';
import AuthLayout from './_auth/AuthLayout';
import SigninForm from './_auth/forms/SigninForm';
import SignupForm from './_auth/forms/SignupForm';
import RootLayout from './_root/RootLayout';
import {
  Home,
  PostDetails,
  AllUsers,
  CreatePost,
  EditPost,
  Explore,
  Profile,
  Saved,
  UpdateProfile,
} from './_root/pages';
import { Toaster } from './components/ui/toaster';

const App = () => {
  return (
    <main className="flex h-screen">
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SigninForm />} />
          <Route path="/sign-up" element={<SignupForm />} />
        </Route>

        {/* Private Routes */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />}></Route>
          <Route path="/saved" element={<Saved />}></Route>
          <Route path="/all-users" element={<AllUsers />}></Route>
          <Route path="/create-post" element={<CreatePost />}></Route>
          <Route path="/update-pos:id" element={<EditPost />}></Route>
          <Route path="/posts/:id" element={<PostDetails />}></Route>
          <Route path="/profile/:id/*" element={<Profile />}></Route>
          <Route path="/update-profile/:id" element={<UpdateProfile />}></Route>
        </Route>
      </Routes>

      <Toaster />
    </main>
  );
};

export default App;
