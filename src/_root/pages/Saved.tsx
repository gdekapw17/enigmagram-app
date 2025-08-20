import {
  useGetSavedPosts,
  useGetCurrentUser,
} from '@/lib/tanstack-query/queriesAndMutations';
import { PostStats, AppLoader } from '@/components/shared';
import { useUserContext } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

const Saved = () => {
  const { user } = useUserContext();
  const { data: currentUser } = useGetCurrentUser();
  const {
    data: savedPosts,
    isLoading,
    error,
  } = useGetSavedPosts(currentUser?.$id);
  console.log(savedPosts);

  // Loading state
  if (isLoading) {
    return <AppLoader />;
  }

  // Error state
  if (error) {
    return (
      <div className="explore-container">
        <div className="flex-center w-full h-full">
          <div>Error loading saved posts</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!savedPosts?.documents?.length) {
    return (
      <div className="explore-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img
            src="/assets/icons/save.svg"
            width={36}
            height={36}
            alt="add-post-icon"
          />
          <h2 className="h3-bold md:h2-bold">Saved Post</h2>
        </div>
        <div className="flex-center w-full h-full">
          <p className="text-light-4">No saved posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <div className="max-w-5xl flex-start gap-3 justify-start w-full">
        <img
          src="/assets/icons/save.svg"
          width={36}
          height={36}
          alt="add-post-icon"
        />
        <h2 className="h3-bold md:h2-bold">Saved Post</h2>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <ul className="grid-container">
          {savedPosts.documents.map((savedPost) => {
            const post = savedPost.post;

            if (!post) return null;

            return (
              <li
                key={`saved-${savedPost.$id}`}
                className="relative min-w-80 h-80"
              >
                <Link to={`/posts/${post.$id}`} className="grid-post_link">
                  <img
                    src={post.imageUrl}
                    alt="post-img"
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="grid-post_user">
                  <div className="flex items-center justify-start gap-2 flex-1">
                    <img
                      src={post.creator?.imageUrl}
                      alt="creator"
                      className="h-8 w-8 rounded-full"
                    />
                    <p className="line-clamp-1">{post.creator?.name}</p>
                  </div>
                  <PostStats post={post} userId={user.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Saved;
