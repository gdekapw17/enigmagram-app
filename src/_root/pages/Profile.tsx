import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useUserContext } from '@/context/AuthContext';
import {
  useGetUserById,
  useGetUserPosts,
  useGetUserLikedPosts,
  useGetUserFollowers,
  useGetUserFollowing,
  useFollowUser,
  useUnfollowUser,
  useCheckIsFollowing,
} from '@/lib/tanstack-query/queriesAndMutations';
import { Button } from '@/components/ui/button';
import { AppLoader, GridPostList, TopUserList } from '@/components/shared';

interface StatBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StatBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useUserContext();
  const [activeTab, setActiveTab] = useState('posts');

  // Queries
  const { data: user, isLoading: isUserLoading } = useGetUserById(id || '');
  const { data: userPosts, isLoading: isPostsLoading } = useGetUserPosts(
    id || '',
  );
  const { data: likedPosts, isLoading: isLikedPostsLoading } =
    useGetUserLikedPosts(id || '');
  const { data: followers, isLoading: isFollowersLoading } =
    useGetUserFollowers(id || '');
  const { data: following, isLoading: isFollowingLoading } =
    useGetUserFollowing(id || '');
  const { data: followStatus } = useCheckIsFollowing(currentUser.id, id || '');

  console.log('Followers data:', followers);
  console.log('Following data:', following);

  // Mutations
  const { mutate: followUser, isPending: isFollowing } = useFollowUser();
  const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

  const isOwnProfile = currentUser.id === id;
  const isFollowed = !!followStatus;

  const handleFollowClick = () => {
    if (isFollowed && followStatus) {
      unfollowUser(followStatus.$id);
    } else if (id) {
      followUser({ followerId: currentUser.id, followingId: id });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex-center w-full h-full">
        <AppLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-center w-full h-full">
        <p className="body-medium text-light-1">User not found</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        if (isPostsLoading) return <AppLoader />;
        return userPosts?.documents?.length ? (
          <GridPostList posts={userPosts.documents} showUser={false} />
        ) : (
          <p className="text-light-4 mt-10 text-center w-full">No posts yet</p>
        );

      case 'liked':
        if (isLikedPostsLoading) return <AppLoader />;
        return likedPosts?.documents?.length ? (
          <GridPostList posts={likedPosts.documents} showUser={false} />
        ) : (
          <p className="text-light-4 mt-10 text-center w-full">
            No liked posts
          </p>
        );

      case 'followers':
        if (isFollowersLoading) return <AppLoader />;
        return (
          <div className="w-full">
            {followers?.documents?.length ? (
              followers.documents.map((follower: any) => (
                <TopUserList key={follower.$id} user={follower.follower} />
              ))
            ) : (
              <p className="text-light-4 mt-10 text-center w-full">
                No followers yet
              </p>
            )}
          </div>
        );

      case 'following':
        if (isFollowingLoading) return <AppLoader />;
        return (
          <div className="w-full user-grid">
            {following?.documents?.length ? (
              following.documents.map((follow: any) => (
                <TopUserList key={follow.$id} user={follow.following} />
              ))
            ) : (
              <p className="text-light-4 mt-10 text-center w-full">
                Not following anyone
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        {/* Profile Header */}
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full object-cover"
          />

          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {user.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{user.username}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20 cursor-pointer">
              <StatBlock
                value={userPosts?.documents?.length || 0}
                label="Posts"
              />
              <div onClick={() => setActiveTab('followers')}>
                <StatBlock value={followers?.total || 0} label="Followers" />
              </div>
              <div onClick={() => setActiveTab('following')}>
                <StatBlock value={following?.total || 0} label="Following" />
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
                {user.bio}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {isOwnProfile ? (
              <Link
                to={`/update-profile/${currentUser.id}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg"
              >
                <img
                  src="/assets/icons/edit.svg"
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            ) : (
              <Button
                type="button"
                className="shad-button_primary px-8"
                onClick={handleFollowClick}
                disabled={isFollowing || isUnfollowing}
              >
                {(isFollowing || isUnfollowing) && <AppLoader />}
                {isFollowed ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex max-w-5xl w-full cursor-pointer">
        <div
          className={`${activeTab === 'posts' ? 'bg-primary-500' : 'bg-dark-2'} profile-tab  rounded-l-lg`}
          onClick={() => setActiveTab('posts')}
        >
          <img
            src="/assets/icons/posts.svg"
            alt="posts"
            width={20}
            height={20}
            className={`${activeTab === 'posts' && 'invert-white'}`}
          />
          Posts
        </div>
        <div
          className={`${activeTab === 'liked' ? 'bg-primary-500' : 'bg-dark-2'} profile-tab rounded-r-lg`}
          onClick={() => setActiveTab('liked')}
        >
          <img
            src="/assets/icons/like.svg"
            alt="liked"
            width={20}
            height={20}
            className={`${activeTab === 'liked' && 'invert-white'}`}
          />
          Liked
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 w-full max-w-5xl">{renderTabContent()}</div>
    </div>
  );
};

export default Profile;
