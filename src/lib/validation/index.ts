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

export const PostValidation = z.object({
  caption: z
    .string()
    .min(5, { message: 'Caption must be at least 5 characters.' })
    .max(2200),
  file: z.custom<File[]>(),
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters.' })
    .max(100),
  tags: z.string(),
});
