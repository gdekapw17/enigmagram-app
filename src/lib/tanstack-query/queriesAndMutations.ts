import {
  useMutation,
  useQueryClient,
  useQuery,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  createUserAccount,
  signInAccount,
  signOutAccount,
  createPost,
  getRecentPosts,
  likePost,
  savePost,
  deleteSavedPost,
  getCurrentUser,
  getPostById,
  updatePost,
  getInfinitePosts,
  searchPosts,
} from '../appwrite/api';
import type { INewUser, INewPost, IUpdatePost } from '@/types';
import { QUERY_KEYS } from './queryKeys';

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
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 10, // 10 menit (sebelumnya cacheTime)
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      likesArray,
    }: {
      postId: string;
      likesArray: string[];
    }) => likePost(postId, likesArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      savePost(postId, userId),
    onSuccess: () => {
      // Invalidate queries untuk update UI
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
    },
    // Optimistic update untuk responsivitas yang lebih baik
    onMutate: async ({ postId, userId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData([
        QUERY_KEYS.GET_CURRENT_USER,
      ]);

      // Optimistically update
      queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], (old: any) => {
        if (!old) return old;

        const newSave = {
          $id: `temp-${Date.now()}`, // temporary ID
          post: { $id: postId },
        };

        return {
          ...old,
          save: [...(old.save || []), newSave],
        };
      });

      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CURRENT_USER],
          context.previousUser,
        );
      }
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
    },
    // Optimistic update
    onMutate: async (savedRecordId) => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });

      const previousUser = queryClient.getQueryData([
        QUERY_KEYS.GET_CURRENT_USER,
      ]);

      queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], (old: any) => {
        if (!old || !old.save) return old;

        return {
          ...old,
          save: old.save.filter((item: any) => item.$id !== savedRecordId),
        };
      });

      return { previousUser };
    },
    onError: (err, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CURRENT_USER],
          context.previousUser,
        );
      }
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 30, // 30 menit
    retry: 1, // Retry sekali jika gagal
  });
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId || ''),
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
    },
  });
};

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: getInfinitePosts,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.documents.length === 0) return null;

      const lastId = lastPage.documents[lastPage?.documents.length - 1].id;

      return lastId;
    },
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};
