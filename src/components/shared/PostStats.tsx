import React, { useState, useEffect } from 'react';
import type { Models } from 'appwrite';
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
} from '@/lib/tanstack-query/queriesAndMutations';
import { useUserContext } from '@/context/AuthContext';
import { checkIsLiked } from '@/types/utils';

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const likesList: string[] = post.likes.map(
    (user: Models.Document) => user.$id,
  );

  const [likes, setLikes] = useState(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavedPost } = useDeleteSavedPost();

  const { user } = useUserContext();

  // Optimized save check
  useEffect(() => {
    setIsSaved(user?.save?.some((s) => s.post.$id === post.$id) ?? false);
  }, [user, post.$id]);

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    const hasLiked = likes.includes(userId);

    const newLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    setLikes(newLikes);
    likePost({ postId: post.$id, likesArray: newLikes });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();

    const savedRecord = user?.save?.find((s) => s.post.$id === post.$id);

    if (savedRecord) {
      deleteSavedPost(savedRecord.$id);
    } else {
      savePost({ postId: post.$id, userId: user.id });
    }
  };

  return (
    <div className="flex justify-between items-center z-20">
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
        <img
          src={isSaved ? '/assets/icons/saved.svg' : '/assets/icons/save.svg'}
          onClick={handleSave}
          className="cursor-pointer"
          alt="save"
        />
      </div>
    </div>
  );
};

export default PostStats;
