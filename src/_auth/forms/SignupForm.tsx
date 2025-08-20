import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signUpValidation } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AppLoader } from '@/components/shared';
import {
  useCreateUserAccount,
  useSignInAccount,
} from '@/lib/tanstack-query/queriesAndMutations';
import { useUserContext } from '@/context/AuthContext';
import { useState } from 'react';

const SignupForm = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const { checkAuthUser } = useUserContext();
  const navigate = useNavigate();

  // Custom hooks dari TanStack Query untuk setiap aksi
  const { mutateAsync: createUserAccount, isPending: isCreatingAccount } =
    useCreateUserAccount();
  const { mutateAsync: signInAccount, isPending: isSigningIn } =
    useSignInAccount();

  // Definisi form dengan Zod sebagai resolver
  const form = useForm<z.infer<typeof signUpValidation>>({
    resolver: zodResolver(signUpValidation),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  // Handler untuk submit form
  async function onSubmit(values: z.infer<typeof signUpValidation>) {
    try {
      setErrorMessage('');
      const newUser = await createUserAccount(values);

      if (!newUser) {
        setErrorMessage('Sign up failed. Please check your credentials.');
        return;
      }

      const session = await signInAccount({
        email: values.email,
        password: values.password,
      });

      if (!session) {
        setErrorMessage('Sign in failed after registration. Please log in.');
        navigate('/sign-in');
        form.resetField('password');
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
      } else {
        setErrorMessage('Sign in failed. Please try again.');
        form.resetField('password');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      form.resetField('password');
    }
  }

  return (
    <Form {...form}>
      <div className="flex-center flex-col sm:w-420 p-10 lg:p-0">
        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Create a new account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
          To use Enigmagram, please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          {/* ... Field untuk Nama, Username, Email, Password ... */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage className="text-red text-sm font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage className="text-red text-sm font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage className="text-red text-sm font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage className="text-red text-sm font-medium" />
              </FormItem>
            )}
          />

          {errorMessage && (
            <p className="text-red text-sm font-medium">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap cursor-pointer"
            disabled={isSigningIn || isCreatingAccount}
          >
            <div className="flex flex-center gap-2">
              {isCreatingAccount && <AppLoader />}
              Sign Up
            </div>
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Already have an account?
            <Link to="/sign-in" className="text-primary-500 font-semibold ml-1">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignupForm;
