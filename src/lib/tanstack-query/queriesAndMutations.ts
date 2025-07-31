import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUserAccount,
  signInAccount,
  signOutAccount,
  createPost,
} from '../appwrite/api';
import type { INewUser } from '@/types';

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Invalidate query 'getRecentPosts' agar feed otomatis ter-update
      queryClient.invalidateQueries({
        queryKey: ['getRecentPosts'],
      });
    },
  });
};
