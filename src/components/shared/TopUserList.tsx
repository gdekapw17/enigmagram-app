import { Link } from 'react-router-dom';
import {
  useFollowUser,
  useUnfollowUser,
  useCheckIsFollowing,
  useGetCurrentUser,
} from '@/lib/tanstack-query/queriesAndMutations';
import { useState } from 'react';
import AppLoader from './AppLoader';

const TopUserList = ({ user }: { user: any }) => {
  const { data: currentUser } = useGetCurrentUser();
  const { mutateAsync: followUser, isPending: isFollowLoading } =
    useFollowUser();
  const { mutateAsync: unfollowUser, isPending: isUnfollowLoading } =
    useUnfollowUser();

  const { data: followRecord, isLoading: isCheckingFollow } =
    useCheckIsFollowing(currentUser?.$id || '', user.$id);

  const [isOptimisticFollowing, setIsOptimisticFollowing] = useState(false);

  const isFollowing = followRecord || isOptimisticFollowing;
  const isLoading = isFollowLoading || isUnfollowLoading || isCheckingFollow;
  const isCurrentUser = currentUser?.$id === user.$id;

  if (isLoading) return <AppLoader />;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser || isCurrentUser || isLoading) return;

    try {
      if (isFollowing) {
        // Unfollow
        setIsOptimisticFollowing(false);
        if (followRecord?.$id) {
          await unfollowUser(followRecord.$id);
        }
      } else {
        // Follow
        setIsOptimisticFollowing(true);
        await followUser({
          followerId: currentUser.$id,
          followingId: user.$id,
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsOptimisticFollowing(!isOptimisticFollowing);
      console.error('Follow/unfollow error:', error);
    }
  };

  const getFollowButtonText = () => {
    if (isCurrentUser) return 'You';
    return isFollowing ? 'Unfollow' : 'Follow';
  };

  const getFollowButtonStyle = () => {
    if (isCurrentUser) {
      return 'bg-gray-500 cursor-not-allowed text-white';
    }
    if (isFollowing) {
      return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
    return 'bg-primary-500 hover:bg-primary-600 text-white';
  };

  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <div className="bg-dark-2 rounded-xl p-4 sm:p-6 flex-center flex-col gap-3 sm:gap-4 border border-dark-4 hover:bg-dark-3 transition-colors w-full min-h-[200px] sm:min-h-[220px] hover:scale-105 hover:shadow-lg">
        <img
          src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
          alt={`${user.name}'s profile`}
          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-primary-500"
        />

        <div className="flex-center flex-col gap-1 w-full">
          <p className="text-sm sm:text-base font-semibold text-light-1 text-center line-clamp-1 w-full">
            {user.name}
          </p>
          {user.username && (
            <p className="text-xs sm:text-sm text-light-3 text-center line-clamp-1 w-full">
              @{user.username}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 text-light-3 w-full text-xs sm:text-sm">
          {user.postsCount !== undefined && (
            <div className="flex items-center gap-1">
              <img
                src="/assets/icons/posts.svg"
                alt="posts"
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="font-medium">{user.postsCount}</span>
            </div>
          )}
          {user.likesCount !== undefined && (
            <div className="flex items-center gap-1">
              <img
                src="/assets/icons/like.svg"
                alt="likes"
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="font-medium">{user.likesCount}</span>
            </div>
          )}
          {user.followersCount !== undefined && (
            <div className="flex items-center gap-1">
              <img
                src="/assets/icons/people.svg"
                alt="followers"
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              <span className="font-medium">{user.followersCount}</span>
            </div>
          )}
        </div>

        {/* Follow Button */}
        <button
          onClick={handleFollowClick}
          disabled={isCurrentUser || isLoading}
          className={`${getFollowButtonStyle()} px-4 sm:px-6 lg:px-8 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {getFollowButtonText()}
        </button>
      </div>
    </Link>
  );
};

export default TopUserList;
