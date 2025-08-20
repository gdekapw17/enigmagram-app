import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signInValidation } from '@/lib/validation';
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
import { useSignInAccount } from '@/lib/tanstack-query/queriesAndMutations';
import { useUserContext } from '@/context/AuthContext';
import { useState } from 'react';

const SigninForm = () => {
  const { checkAuthUser } = useUserContext();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: signInAccount, isPending: isSigningIn } =
    useSignInAccount();

  const form = useForm<z.infer<typeof signInValidation>>({
    resolver: zodResolver(signInValidation),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof signInValidation>) {
    try {
      setErrorMessage(''); // reset error
      const session = await signInAccount(values);

      if (!session) {
        setErrorMessage('Sign in failed. Please check your credentials.');
        form.resetField('password');
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        navigate('/');
      } else {
        setErrorMessage('Sign in failed. Please try again.');
        form.resetField('password');
      }
    } catch (error) {
      console.log(error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      form.resetField('password');
    }
  }

  return (
    <Form {...form}>
      <div className="flex-center flex-col sm:w-420 p-10 lg:p-0">
        <h2 className="pt-5 sm:pt-12 h3-bold md:h2-bold">
          Log in to your account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Welcome back! Please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full mt-4"
        >
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
            disabled={isSigningIn}
          >
            <div className="flex flex-center gap-2">
              {isSigningIn && <AppLoader />}
              Sign In
            </div>
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?
            <span>
              <Link
                to="/sign-up"
                className="text-primary-500 font-semibold ml-1"
              >
                Sign up
              </Link>
            </span>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
