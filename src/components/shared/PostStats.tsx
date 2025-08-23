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
  // ✅ Improved likes list extraction
  const likesList: string[] = useMemo(() => {
    if (!post?.likes || !Array.isArray(post.likes)) {
      return [];
    }

    console.log('Processing likes for post:', post.$id, post.likes);

    return post.likes
      .map((like: any) => {
        // Handle relationship field 'users' (plural)
        if (like.users && typeof like.users === 'object') {
          return like.users.$id;
        }
        // Handle relationship field 'user' (singular)
        if (like.user && typeof like.user === 'object') {
          return like.user.$id;
        }
        // Handle string ID for 'users' field
        if (like.users && typeof like.users === 'string') {
          return like.users;
        }
        // Handle string ID for 'user' field
        if (like.user && typeof like.user === 'string') {
          return like.user;
        }
        // Fallback
        return like.$id || like;
      })
      .filter(Boolean); // Remove any undefined/null values
  }, [post?.likes, post?.$id]);

  // ✅ Initialize likes from server data, not empty array
  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ CRITICAL: Always sync local state with server data
  useEffect(() => {
    console.log('Syncing likes state:', {
      likesList,
      currentLikes: likes,
      postId: post?.$id,
    });
    setLikes(likesList);
  }, [likesList]); // This will run when post data changes (including after refresh)

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

    // ✅ Optimistic update dengan rollback mechanism
    const newLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    const previousLikes = likes;
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
        // ✅ Note: onSuccess handled by query invalidation in useLikePost
        // This will refetch the post data with updated likes
      },
    );
  };

  const handleSavePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent action jika data belum diinisialisasi
    if (!isInitialized) return;

    if (savedPostRecord) {
      // Unsave post
      setIsSaved(false);
      deleteSavedPost(savedPostRecord.$id, {
        onError: () => {
          // Rollback state jika error
          setIsSaved(true);
        },
      });
    } else {
      // Save post
      setIsSaved(true);
      savePost(
        { postId: post?.$id || '', userId: userId },
        {
          onError: () => {
            // Rollback state jika error
            setIsSaved(false);
          },
        },
      );
    }
  };

  // Show loading state untuk save button jika data belum diinisialisasi
  const showSaveLoader =
    isSavingPost || isDeletingPost || isLoadingUser || !isInitialized;

  // ✅ Debug logging
  console.log('PostStats render:', {
    postId: post?.$id,
    likesCount: likes.length,
    likesList: likesList,
    currentLikes: likes,
    hasLiked: checkIsLiked(likes, userId),
    isLiking,
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
