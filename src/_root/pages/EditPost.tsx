import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostById } from '@/lib/tanstack-query/queriesAndMutations';
import PostForm from '@/components/forms/PostForm';
import { AppLoader } from '@/components/shared';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, isPending } = useGetPostById(id || '');

  if (isPending) {
    return (
      <div className="flex-center w-full h-full">
        <AppLoader />
      </div>
    );
  }

  if (!post) {
    navigate('/');
    return null;
  }

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img
            src="/assets/icons/edit.svg"
            width={36}
            height={36}
            alt="edit-post-icon"
          />
          <h2 className="h3-bold md:h2-bold">Edit Post</h2>
        </div>
        <PostForm action="Update" post={post} />
      </div>
    </div>
  );
};

export default EditPost;
