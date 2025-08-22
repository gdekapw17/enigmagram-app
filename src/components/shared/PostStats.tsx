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
  const likesList: string[] = useMemo(() => {
    if (!post?.likes || !Array.isArray(post.likes)) {
      return [];
    }

    // Handle both populated and non-populated likes
    return post.likes.map((like: any) => {
      // Jika like adalah object dengan user relation
      if (like.user && typeof like.user === 'object') {
        return like.user.$id;
      }
      // Jika like adalah object dengan user ID string
      if (like.user && typeof like.user === 'string') {
        return like.user;
      }
      // Fallback untuk struktur lama
      if (like.$id) {
        return like.$id;
      }
      return like;
    });
  }, [post?.likes]);

  const [likes, setLikes] = useState(likesList);
  const [isSaved, setIsSaved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Update likes state ketika post data berubah
  useEffect(() => {
    setLikes(likesList);
  }, [likesList]);

  const { mutate: likePost } = useLikePost();
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

    const hasLiked = likes.includes(userId);

    // ✅ Optimistic update untuk UI yang responsive
    const newLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    setLikes(newLikes);

    likePost({
      postId: post?.$id || '',
      userId: userId,
    });
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
          className="cursor-pointer"
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
