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
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  checkIsFollowing,
  searchPostsByHashtag,
  getTrendingHashtags,
  advancedSearchPosts,
  getUserById,
  getUserPosts,
  getUserLikedPosts,
  updateUserProfile,
  getUserStats,
  checkUserLikedPost,
} from '../appwrite/api';
import type { INewUser, INewPost, IUpdatePost } from '@/types';
import { QUERY_KEYS } from './queryKeys';
import { useEffect } from 'react';

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
    staleTime: 1000 * 30, // ✅ Reduce to 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      userId,
    }: {
      postId: string;
      userId: string;
    }) => {
      console.log('🚀 Starting like mutation:', { postId, userId });
      const result = await likePost(postId, userId);

      if (!result.success) {
        throw new Error('Failed to like/unlike post');
      }

      return result;
    },

    onMutate: async ({ postId, userId }) => {
      console.log('🔄 Optimistic update started for:', { postId, userId });

      // ✅ Cancel all outgoing queries to prevent race conditions
      const queriesToCancel = [
        [QUERY_KEYS.GET_POST_BY_ID, postId],
        [QUERY_KEYS.GET_RECENT_POSTS],
        [QUERY_KEYS.GET_INFINITE_POSTS],
        [QUERY_KEYS.GET_USER_LIKED_POSTS, userId],
        [QUERY_KEYS.SEARCH_POSTS],
      ];

      await Promise.all(
        queriesToCancel.map((queryKey) =>
          queryClient.cancelQueries({ queryKey }),
        ),
      );

      // ✅ Snapshot all previous values for rollback
      const previousData = {
        post: queryClient.getQueryData([QUERY_KEYS.GET_POST_BY_ID, postId]),
        recentPosts: queryClient.getQueryData([QUERY_KEYS.GET_RECENT_POSTS]),
        infinitePosts: queryClient.getQueryData([
          QUERY_KEYS.GET_INFINITE_POSTS,
        ]),
        userLikedPosts: queryClient.getQueryData([
          QUERY_KEYS.GET_USER_LIKED_POSTS,
          userId,
        ]),
      };

      // ✅ Optimistic update: Single post
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_BY_ID, postId],
        (oldData: any) => {
          if (!oldData) return oldData;

          const userAlreadyLiked = oldData.likes?.some(
            (like: any) => like.users === userId || like.user === userId,
          );

          if (userAlreadyLiked) {
            // Remove like
            return {
              ...oldData,
              likes: oldData.likes.filter(
                (like: any) => like.users !== userId && like.user !== userId,
              ),
              likesCount: Math.max(0, (oldData.likesCount || 0) - 1),
            };
          } else {
            // Add like
            const newLike = {
              $id: `temp-${Date.now()}`,
              users: userId,
              posts: postId,
              $createdAt: new Date().toISOString(),
            };
            return {
              ...oldData,
              likes: [...(oldData.likes || []), newLike],
              likesCount: (oldData.likesCount || 0) + 1,
            };
          }
        },
      );

      // ✅ Optimistic update: Recent posts
      queryClient.setQueryData(
        [QUERY_KEYS.GET_RECENT_POSTS],
        (oldData: any) => {
          if (!oldData?.documents) return oldData;

          return {
            ...oldData,
            documents: oldData.documents.map((post: any) => {
              if (post.$id !== postId) return post;

              const userAlreadyLiked = post.likes?.some(
                (like: any) => like.users === userId || like.user === userId,
              );

              if (userAlreadyLiked) {
                return {
                  ...post,
                  likes: post.likes.filter(
                    (like: any) =>
                      like.users !== userId && like.user !== userId,
                  ),
                  likesCount: Math.max(0, (post.likesCount || 0) - 1),
                };
              } else {
                const newLike = {
                  $id: `temp-${Date.now()}`,
                  users: userId,
                  posts: postId,
                };
                return {
                  ...post,
                  likes: [...(post.likes || []), newLike],
                  likesCount: (post.likesCount || 0) + 1,
                };
              }
            }),
          };
        },
      );

      // ✅ Optimistic update: Infinite posts
      queryClient.setQueryData(
        [QUERY_KEYS.GET_INFINITE_POSTS],
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              documents: page.documents.map((post: any) => {
                if (post.$id !== postId) return post;

                const userAlreadyLiked = post.likes?.some(
                  (like: any) => like.users === userId || like.user === userId,
                );

                if (userAlreadyLiked) {
                  return {
                    ...post,
                    likes: post.likes.filter(
                      (like: any) =>
                        like.users !== userId && like.user !== userId,
                    ),
                    likesCount: Math.max(0, (post.likesCount || 0) - 1),
                  };
                } else {
                  const newLike = {
                    $id: `temp-${Date.now()}`,
                    users: userId,
                    posts: postId,
                  };
                  return {
                    ...post,
                    likes: [...(post.likes || []), newLike],
                    likesCount: (post.likesCount || 0) + 1,
                  };
                }
              }),
            })),
          };
        },
      );

      return { previousData, postId, userId };
    },

    onSuccess: async (data, variables) => {
      console.log('✅ Like mutation success:', data);

      // ✅ CRITICAL: Invalidate all related queries untuk fresh data
      const queriesToInvalidate = [
        [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
        [QUERY_KEYS.GET_RECENT_POSTS],
        [QUERY_KEYS.GET_INFINITE_POSTS],
        [QUERY_KEYS.GET_POSTS],
        [QUERY_KEYS.GET_USER_LIKED_POSTS, variables.userId],
        [QUERY_KEYS.SEARCH_POSTS],
        [QUERY_KEYS.GET_SAVED_POSTS],
      ];

      // Invalidate dengan delay untuk menghindari race condition
      setTimeout(() => {
        queriesToInvalidate.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }, 100);

      // ✅ Force refetch query paling penting
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
        });
      }, 200);
    },

    onError: (error, variables, context) => {
      console.error('❌ Like mutation error:', error);

      // ✅ Rollback optimistic updates
      if (context?.previousData) {
        const { previousData } = context;

        if (previousData.post) {
          queryClient.setQueryData(
            [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
            previousData.post,
          );
        }

        if (previousData.recentPosts) {
          queryClient.setQueryData(
            [QUERY_KEYS.GET_RECENT_POSTS],
            previousData.recentPosts,
          );
        }

        if (previousData.infinitePosts) {
          queryClient.setQueryData(
            [QUERY_KEYS.GET_INFINITE_POSTS],
            previousData.infinitePosts,
          );
        }

        if (previousData.userLikedPosts) {
          queryClient.setQueryData(
            [QUERY_KEYS.GET_USER_LIKED_POSTS, variables.userId],
            previousData.userLikedPosts,
          );
        }
      }

      // ✅ Refetch untuk data yang benar
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
        });
      }, 500);
    },

    onSettled: (data, error, variables) => {
      console.log(data);
      console.log(error);
      // ✅ Final cleanup - ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID, variables.postId],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_USER_LIKED_POSTS, variables.userId],
        });
      }, 1000);
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      savePost(postId, userId),
    onSuccess: (data, variables) => {
      console.log(data);
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
      console.log(err);
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
      console.log(data);
      console.log(savedRecordId);
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
      console.log(err);
      console.log(variables);
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
  const query = useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30, // valid di v5
    retry: (failureCount, error: any) => {
      if (error?.code === 401 || error?.type === 'general_unauthorized_scope') {
        return false;
      }
      return failureCount < 1;
    },
  });

  // Handle error dengan useEffect
  useEffect(() => {
    if (query.error) {
      console.log('getCurrentUser error:', query.error);
      if (
        query.error?.code === 401 ||
        query.error?.type === 'general_unauthorized_scope'
      ) {
        localStorage.removeItem('cookieFallback');
      }
    }
  }, [query.error]);

  return query;
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId || ''),
    enabled: !!postId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
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
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.documents.length === 0) {
        return undefined;
      }
      return lastPage.documents[lastPage.documents.length - 1].$id;
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm && searchTerm.trim().length >= 1, // Allow single character search
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useSearchPostsByHashtag = (hashtag: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS_BY_HASHTAG, hashtag],
    queryFn: () => searchPostsByHashtag(hashtag),
    enabled: !!hashtag && hashtag.trim().length >= 1,
    staleTime: 1000 * 60 * 2,
  });
};

export const useGetTrendingHashtags = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TRENDING_HASHTAGS, limit],
    queryFn: () => getTrendingHashtags(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useAdvancedSearchPosts = (searchOptions: {
  query?: string;
  hashtags?: string[];
  location?: string;
  creator?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const hasSearchCriteria = Object.values(searchOptions).some((value) =>
    Array.isArray(value) ? value.length > 0 : !!value?.toString().trim(),
  );

  return useQuery({
    queryKey: [QUERY_KEYS.ADVANCED_SEARCH_POSTS, searchOptions],
    queryFn: () => advancedSearchPosts(searchOptions),
    enabled: hasSearchCriteria,
    staleTime: 1000 * 60 * 2,
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

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      followerId,
      followingId,
    }: {
      followerId: string;
      followingId: string;
    }) => followUser(followerId, followingId),
    onSuccess: (data, variables) => {
      console.log(data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWERS, variables.followingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWING, variables.followerId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.CHECK_IS_FOLLOWING,
          variables.followerId,
          variables.followingId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_TOP_USERS],
      });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followRecordId: string) => unfollowUser(followRecordId),
    onSuccess: () => {
      // Invalidate all follow-related queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWING],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_IS_FOLLOWING],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_TOP_USERS],
      });
    },
  });
};

export const useGetUserFollowers = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_FOLLOWERS, userId],
    queryFn: () => getUserFollowers(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
};

export const useGetUserFollowing = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_FOLLOWING, userId],
    queryFn: () => getUserFollowing(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
};

export const useCheckIsFollowing = (
  followerId: string,
  followingId: string,
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_IS_FOLLOWING, followerId, followingId],
    queryFn: () => checkIsFollowing(followerId, followingId),
    enabled: !!followerId && !!followingId && followerId !== followingId,
    staleTime: 1000 * 60 * 2, // 2 menit
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useGetUserPosts = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useGetUserLikedPosts = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_LIKED_POSTS, userId],
    queryFn: () => getUserLikedPosts(userId),
    enabled: !!userId,
    staleTime: 1000 * 10, // ✅ Reduce stale time untuk data segar
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // ✅ Add retry logic
    retry: (failureCount, error) => {
      console.log(error);
      if (failureCount >= 2) return false;
      return true;
    },
    // ✅ Add refetch interval for critical data
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: {
      userId: string;
      name: string;
      bio?: string;
      imageId?: string;
      imageUrl?: string;
      file: File[];
    }) => updateUserProfile(user),
    onSuccess: (data, variables) => {
      // ✅ Invalidate semua queries yang berkaitan dengan user profile
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, variables.userId],
      });

      // ✅ Invalidate current user jika yang di-update adalah current user
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });

      // ✅ Invalidate user stats
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_STATS, variables.userId],
      });

      // ✅ Invalidate top users (jika ada perubahan name/image akan terlihat)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_TOP_USERS],
      });

      // ✅ Invalidate all users list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ALL_USERS],
      });

      // ✅ Invalidate posts yang dibuat oleh user ini (untuk update creator info)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_POSTS, variables.userId],
      });

      // ✅ Invalidate recent posts (jika user ini ada di recent posts)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });

      // ✅ Invalidate infinite posts
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
      });

      // ✅ Invalidate followers/following lists (untuk update user info di lists)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWERS],
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWING],
      });

      // ✅ BONUS: Update cache secara optimistic untuk response yang lebih cepat
      // Update user data di cache langsung tanpa tunggu refetch
      queryClient.setQueryData(
        [QUERY_KEYS.GET_USER_BY_ID, variables.userId],
        data,
      );

      // Update current user cache jika yang di-update adalah current user
      queryClient.setQueryData(
        [QUERY_KEYS.GET_CURRENT_USER],
        (oldData: any) => {
          if (oldData && oldData.$id === variables.userId) {
            return { ...oldData, ...data };
          }
          return oldData;
        },
      );
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
    },
  });
};

export const useGetUserStats = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_STATS, userId],
    queryFn: () => getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useCheckUserLikedPost = (userId: string, postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_USER_LIKED_POST, userId, postId],
    queryFn: () => checkUserLikedPost(userId, postId),
    enabled: !!userId && !!postId,
    staleTime: 1000 * 5, // 5 seconds
    gcTime: 1000 * 60, // 1 minute
  });
};
