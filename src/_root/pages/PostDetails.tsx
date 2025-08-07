import { useParams } from 'react-router-dom';
import { AppLoader } from '@/components/shared';
import { useGetPostById } from '@/lib/tanstack-query/queriesAndMutations';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/types/utils';

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending } = useGetPostById(id || '');

  if (isPending) return <AppLoader />;

  return (
    <div className="flex items-center gap-3">
      <Link to={`/profile/${post?.creator.$id}`}>
        <img
          src={
            post?.creator.imageUrl || '/assets/icons/profile-placeholder.svg'
          }
          alt="creator-image"
          className="rounded-full w-12 h-12"
        />
      </Link>

      <div className="flex flex-col">
        <p className="base-medium lg:body-bold text-light-1">
          {post?.creator.name}
        </p>
        <div className="flex-center gap-2 text-light-3">
          <p className="subtle-semibold lg:small-regular">
            {post?.$createdAt
              ? formatRelativeTime(post.$createdAt)
              : 'Just now'}
          </p>
          -<p className="subtle-semibold lg:small-reguler">{post?.location}</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
