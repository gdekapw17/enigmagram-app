import { useParams, Link } from 'react-router-dom';
import { AppLoader, PostStats } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useGetPostById } from '@/lib/tanstack-query/queriesAndMutations';
import { formatRelativeTime } from '@/types/utils';
import { useUserContext } from '@/context/AuthContext';

// Define Post type based on your API structure
interface IPost {
  $id: string;
  $createdAt: string;
  caption?: string;
  imageUrl?: string;
  imageId?: string;
  location?: string;
  tags?: string[];
  creator?: {
    $id: string;
    name: string;
    imageUrl?: string;
    username?: string;
  };
  likes?: any[];
  likesCount?: number;
}

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending, error } = useGetPostById(id || '');
  const { user } = useUserContext();

  const typedPost = post as IPost | undefined;

  // Process tags safely
  const tags =
    typedPost?.tags
      ?.map((tag: string) =>
        tag
          .toLowerCase()
          .replace(/[#]| *\([^)]*\)#*/g, '')
          .trim(),
      )
      .filter((tag: string) => tag.length > 0) || [];

  const handleDeletePost = () => {
    // Implementation for delete post
    console.log('Delete post:', typedPost?.$id);
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
  if (!typedPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-light-2 text-lg mb-4">Post not found</p>
        <Link to="/" className="text-primary-500 hover:underline">
          Go back to home
        </Link>
      </div>
    );
  }

  // Get image URL with fallback - check the actual property name from your API
  const imageUrl =
    (typedPost as any).imageUrl ||
    (typedPost as any).image_url ||
    '/assets/images/placeholder.png';

  // Get creator info with fallbacks
  const creatorName = typedPost.creator?.name || 'Unknown User';
  const creatorImageUrl =
    typedPost.creator?.imageUrl || '/assets/icons/profile-placeholder.svg';
  const creatorId = typedPost.creator?.$id;

  // Format date safely
  const formattedDate = typedPost.$createdAt
    ? formatRelativeTime(typedPost.$createdAt)
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
                  {typedPost.location && (
                    <>
                      -
                      <p className="subtle-semibold lg:small-regular">
                        {typedPost.location}
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
                  to={`/update-post/${typedPost.$id}`}
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
            {typedPost.caption && (
              <p className="break-all mb-2">{typedPost.caption}</p>
            )}

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
            <PostStats post={post as any} userId={user?.id || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
