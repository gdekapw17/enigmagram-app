import { useParams, Link } from 'react-router-dom';
import { AppLoader, PostStats } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useGetPostById } from '@/lib/tanstack-query/queriesAndMutations';
import { formatRelativeTime } from '@/types/utils';
import { useUserContext } from '@/context/AuthContext';

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending, error } = useGetPostById(id || '');
  const { user } = useUserContext();

  // Process tags safely
  const tags =
    post?.tags
      ?.map((tag: string) =>
        tag
          .toLowerCase()
          .replace(/[#]| *\([^)]*\)#*/g, '')
          .trim(),
      )
      .filter((tag: string) => tag.length > 0) || [];

  const handleDeletePost = () => {
    // Implementation for delete post
    console.log('Delete post:', post?.$id);
  };

  if (isPending) return <AppLoader />;

  // Handle error case
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-light-2 text-lg mb-4">Failed to load post</p>
        <Link to="/" className="text-primary-500 hover:underline">
          Go back to home
        </Link>
      </div>
    );
  }

  // Handle no post found
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-light-2 text-lg mb-4">Post not found</p>
        <Link to="/" className="text-primary-500 hover:underline">
          Go back to home
        </Link>
      </div>
    );
  }

  // Get image URL with fallback
  const imageUrl =
    post.imageUrl || post.image_url || '/assets/images/placeholder.png';

  // Get creator info with fallbacks
  const creatorName = post.creator?.name || 'Unknown User';
  const creatorImageUrl =
    post.creator?.imageUrl ||
    post.creator?.image_url ||
    '/assets/icons/profile-placeholder.svg';
  const creatorId = post.creator?.$id || post.creator?.id;

  // Format date safely
  const formattedDate = post.$createdAt
    ? formatRelativeTime(post.$createdAt)
    : 'Just now';

  return (
    <div className="post_details-container">
      <div className="post_details-card">
        {/* Post Image */}
        <img
          src={imageUrl}
          alt="post"
          className="post_details-img flex self-center"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = '/assets/images/placeholder.png';
          }}
        />

        <div className="post_details-info">
          <div className="flex-between w-full">
            {/* Creator Info */}
            <Link
              to={`/profile/${creatorId}`}
              className="flex items-center gap-3"
            >
              <img
                src={creatorImageUrl}
                alt="creator-image"
                className="rounded-full w-8 lg:w-12 h-8 lg:h-12 object-cover"
                onError={(e) => {
                  // Fallback if creator image fails to load
                  e.currentTarget.src = '/assets/icons/profile-placeholder.svg';
                }}
              />

              <div className="flex flex-col">
                <p className="base-medium lg:body-bold text-light-1">
                  {creatorName}
                </p>
                <div className="flex-center gap-2 text-light-3">
                  <p className="subtle-semibold lg:small-regular">
                    {formattedDate}
                  </p>
                  {post.location && (
                    <>
                      -
                      <p className="subtle-semibold lg:small-regular">
                        {post.location}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Link>

            {/* Action Buttons - Only show if user is the creator */}
            {user?.id === creatorId && (
              <div className="flex-center gap-4">
                <Link
                  to={`/update-post/${post.$id}`}
                  className="flex items-center justify-center"
                >
                  <img
                    src="/assets/icons/edit.svg"
                    alt="edit"
                    width={24}
                    height={24}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className="ghost_details-delete-btn p-0 m-0"
                >
                  <img
                    src="/assets/icons/delete.svg"
                    alt="delete"
                    width={24}
                    height={24}
                  />
                </Button>
              </div>
            )}
          </div>

          <hr className="border w-full border-dark-4/80" />

          {/* Post Content */}
          <div className="small-medium lg:base-regular flex flex-col flex-1">
            {post.caption && <p className="break-all mb-2">{post.caption}</p>}

            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag: string, index: number) => (
                  <li key={`${tag}-${index}`} className="text-light-3">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Post Stats */}
          <div className="w-full">
            <PostStats post={post} userId={user?.id || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
