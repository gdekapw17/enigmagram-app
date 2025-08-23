import React, { useState, useEffect, useMemo } from 'react';
import type { Models } from 'appwrite';
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from '@/lib/tanstack-query/queriesAndMutations';
import { checkIsLiked } from '@/types/utils';
import { AppLoader } from '@/components/shared';

type PostStatsProps = {
  post?: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  // ✅ PERBAIKAN: Improved likes list extraction dengan error handling yang lebih baik
  const likesList: string[] = useMemo(() => {
    if (!post?.likes || !Array.isArray(post.likes)) {
      return [];
    }

    console.log('Processing likes for post:', post.$id, 'likes:', post.likes);

    return post.likes
      .map((like: any) => {
        // ✅ Handle relationship field 'users' (sesuai database structure)
        if (like.users) {
          // Jika users adalah object dengan $id
          if (typeof like.users === 'object' && like.users.$id) {
            return like.users.$id;
          }
          // Jika users adalah string ID
          if (typeof like.users === 'string') {
            return like.users;
          }
        }

        // ✅ Fallback untuk backward compatibility dengan 'user' (singular)
        if (like.user) {
          if (typeof like.user === 'object' && like.user.$id) {
            return like.user.$id;
          }
          if (typeof like.user === 'string') {
            return like.user;
          }
        }

        // Last fallback - jika like object itu sendiri adalah ID
        if (typeof like === 'string') {
          return like;
        }

        return null;
      })
      .filter((id): id is string => id !== null && id !== undefined);
  }, [post?.likes, post?.$id]);

  // ✅ PERBAIKAN: State management yang lebih robust
  const [likes, setLikes] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ PERBAIKAN: Sync local state dengan server data setiap kali post berubah
  useEffect(() => {
    console.log('Syncing likes state:', {
      postId: post?.$id,
      serverLikes: likesList,
      localLikes: likes,
      shouldUpdate: JSON.stringify(likesList) !== JSON.stringify(likes),
    });

    // Hanya update jika benar-benar berbeda untuk mencegah infinite loop
    if (JSON.stringify(likesList) !== JSON.stringify(likes)) {
      setLikes(likesList);
    }
  }, [likesList, post?.$id]); // Removed 'likes' from dependency to prevent infinite loop

  const { mutate: likePost, isPending: isLiking } = useLikePost();
  const {
    mutate: savePost,
    isPending: isSavingPost,
    error: saveError,
  } = useSavePost();
  const {
    mutate: deleteSavedPost,
    isPending: isDeletingPost,
    error: deleteError,
  } = useDeleteSavedPost();

  const {
    data: currentUser,
    isLoading: isLoadingUser,
    isSuccess: isUserLoaded,
  } = useGetCurrentUser();

  const savedPostRecord = useMemo(() => {
    if (!currentUser?.save || !Array.isArray(currentUser.save)) {
      return null;
    }

    return currentUser.save.find(
      (record: Models.Document) => record.post?.$id === post?.$id,
    );
  }, [currentUser?.save, post?.$id]);

  // Update isSaved hanya setelah user data berhasil dimuat
  useEffect(() => {
    if (isUserLoaded && currentUser) {
      setIsSaved(!!savedPostRecord);
      setIsInitialized(true);
    }
  }, [isUserLoaded, currentUser, savedPostRecord]);

  // Reset initialization state saat user berubah (logout/login)
  useEffect(() => {
    if (!currentUser && isInitialized) {
      setIsInitialized(false);
      setIsSaved(false);
    }
  }, [currentUser, isInitialized]);

  // Log errors untuk debugging
  useEffect(() => {
    if (saveError) {
      console.error('Save post error:', saveError);
    }
    if (deleteError) {
      console.error('Delete saved post error:', deleteError);
    }
  }, [saveError, deleteError]);

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!post?.$id || !userId) return;

    const hasLiked = likes.includes(userId);
    const newLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    const previousLikes = [...likes]; // Create copy for rollback

    // ✅ PERBAIKAN: Optimistic update
    setLikes(newLikes);

    likePost(
      {
        postId: post.$id,
        userId: userId,
      },
      {
        onError: (error) => {
          console.error('Like post failed:', error);
          // ✅ Rollback optimistic update on error
          setLikes(previousLikes);
        },
        onSuccess: (data) => {
          console.log('✅ Like operation successful:', data);
          // ✅ PERBAIKAN: Tidak perlu update manual karena query invalidation akan handle
          // State akan di-sync ulang dari useEffect ketika post data di-refetch
        },
      },
    );
  };

  const handleSavePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent action jika data belum diinisialisasi
    if (!isInitialized) return;

    if (savedPostRecord) {
      // Unsave post
      const previousSaved = isSaved;
      setIsSaved(false);

      deleteSavedPost(savedPostRecord.$id, {
        onError: () => {
          // Rollback state jika error
          setIsSaved(previousSaved);
        },
      });
    } else {
      // Save post
      const previousSaved = isSaved;
      setIsSaved(true);

      savePost(
        { postId: post?.$id || '', userId: userId },
        {
          onError: () => {
            // Rollback state jika error
            setIsSaved(previousSaved);
          },
        },
      );
    }
  };

  // Show loading state untuk save button jika data belum diinisialisasi
  const showSaveLoader =
    isSavingPost || isDeletingPost || isLoadingUser || !isInitialized;

  // ✅ Enhanced debug logging
  console.log('PostStats render:', {
    postId: post?.$id,
    likesCount: likes.length,
    serverLikesList: likesList,
    localLikes: likes,
    hasLiked: checkIsLiked(likes, userId),
    isLiking,
    isPostDataStale: JSON.stringify(likesList) !== JSON.stringify(likes),
  });

  return (
    <div className="flex justify-between items-center z-20 gap-4">
      <div className="flex gap-2">
        <img
          src={
            checkIsLiked(likes, userId)
              ? '/assets/icons/liked.svg'
              : '/assets/icons/like.svg'
          }
          alt="like"
          width={20}
          height={20}
          onClick={handleLikePost}
          className={`cursor-pointer ${isLiking ? 'opacity-50' : ''}`}
          style={{ pointerEvents: isLiking ? 'none' : 'auto' }}
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex gap-2">
        {showSaveLoader ? (
          <AppLoader />
        ) : (
          <img
            src={isSaved ? '/assets/icons/saved.svg' : '/assets/icons/save.svg'}
            alt="save"
            width={20}
            height={20}
            onClick={handleSavePost}
            className="cursor-pointer"
          />
        )}
      </div>
    </div>
  );
};

export default PostStats;
