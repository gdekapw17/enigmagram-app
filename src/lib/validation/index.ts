import * as z from 'zod';

export const signUpValidation = z.object({
  name: z.string().min(2, { message: 'name is too short' }),
  username: z.string().min(2, { message: 'Username is too short' }),
  email: z.email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});

export const signInValidation = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});
