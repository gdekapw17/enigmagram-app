import { useParams } from 'react-router-dom';
import {
  useGetUserPosts,
  useGetUserById,
} from '@/lib/tanstack-query/queriesAndMutations';
import { GridPostList } from '@/components/shared';

const Profile = () => {
  const { id } = useParams();
  const { data: user } = useGetUserById(id || '');
  const { data: posts } = useGetUserPosts(id || '');
  console.log(posts);

  return (
    <div>
      {user?.name}
      <div>
        <GridPostList posts={posts?.documents as any} />
      </div>
    </div>
  );
};

export default Profile;
