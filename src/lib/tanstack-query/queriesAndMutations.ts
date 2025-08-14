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
  getSavedPosts,
  getTopUsers,
  searchUsers,
  getAllUsers,
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
    onSuccess: (data, variables) => {
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
      // 🆕 Invalidate saved posts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS, variables.userId],
      });
    },
    // Optimistic update untuk responsivitas yang lebih baik
    onMutate: async ({ postId, userId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
      });

      // Snapshot previous values
      const previousUser = queryClient.getQueryData([
        QUERY_KEYS.GET_CURRENT_USER,
      ]);
      const previousSavedPosts = queryClient.getQueryData([
        QUERY_KEYS.GET_SAVED_POSTS,
        userId,
      ]);

      // Optimistically update current user
      queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], (old: any) => {
        if (!old) return old;

        const newSave = {
          $id: `temp-${Date.now()}`,
          post: { $id: postId },
        };

        return {
          ...old,
          save: [...(old.save || []), newSave],
        };
      });

      // 🆕 Optimistically update saved posts list
      queryClient.setQueryData(
        [QUERY_KEYS.GET_SAVED_POSTS, userId],
        (old: any) => {
          if (!old) return old;

          const newSavedPost = {
            $id: `temp-${Date.now()}`,
            $createdAt: new Date().toISOString(),
            user: userId,
            post: { $id: postId },
          };

          return {
            ...old,
            documents: [newSavedPost, ...old.documents],
            total: old.total + 1,
          };
        },
      );

      return { previousUser, previousSavedPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CURRENT_USER],
          context.previousUser,
        );
      }
      if (context?.previousSavedPosts) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_SAVED_POSTS, variables.userId],
          context.previousSavedPosts,
        );
      }
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: (data, savedRecordId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      // 🆕 Invalidate all saved posts queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS],
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

      // Update current user
      queryClient.setQueryData([QUERY_KEYS.GET_CURRENT_USER], (old: any) => {
        if (!old || !old.save) return old;

        return {
          ...old,
          save: old.save.filter((item: any) => item.$id !== savedRecordId),
        };
      });

      // 🆕 Update saved posts lists
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.GET_SAVED_POSTS] },
        (old: any) => {
          if (!old || !old.documents) return old;

          return {
            ...old,
            documents: old.documents.filter(
              (item: any) => item.$id !== savedRecordId,
            ),
            total: Math.max(0, old.total - 1),
          };
        },
      );

      return { previousUser };
    },
    onError: (err, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CURRENT_USER],
          context.previousUser,
        );
      }
      // Invalidate to refetch correct data
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS],
      });
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
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetSavedPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
    queryFn: () => getSavedPosts(userId || ''),
    enabled: !!userId, // Hanya jalankan query jika userId ada
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 10, // 10 menit
    retry: 1, // Retry sekali jika gagal
  });
};

export const useGetTopUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOP_USERS],
    queryFn: getTopUsers,
    staleTime: 1000 * 60 * 10, // 10 menit
    gcTime: 1000 * 60 * 30, // 30 menit
    retry: 1,
  });
};

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_USERS, searchTerm],
    queryFn: () => searchUsers(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: 1,
  });
};

export const useGetAllUsers = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_ALL_USERS],
    queryFn: getAllUsers,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    staleTime: 1000 * 60 * 5,
  });
};
