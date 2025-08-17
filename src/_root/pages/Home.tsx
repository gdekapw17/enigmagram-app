import { AppLoader, PostCard, TopUserList } from '@/components/shared';
import {
  useGetRecentPosts,
  useGetTopUsers,
} from '@/lib/tanstack-query/queriesAndMutations';
import type { Models } from 'appwrite';

const Home = () => {
  const {
    data: posts,
    isPending: isPostLoading,
    isError: isPostError,
  } = useGetRecentPosts();

  const { data: topUsers } = useGetTopUsers();

  if (isPostError)
    return (
      <p className="text-light-4 mt-10 text-center w-full">
        Something is wrong
      </p>
    );

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isPostLoading && !posts ? (
            <AppLoader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full">
              {posts?.documents.map((post: Models.Document) => (
                <li key={post.$id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden lg:flex flex-col min-w-[350px]">
          <div className="bg-dark-2 rounded-2xl p-6 sticky top-20">
            <h3 className="h3-bold text-light-1 mb-6">Popular Creators</h3>
            <div className="flex flex-col gap-5">
              {topUsers?.documents.slice(0, 5).map((user) => (
                <TopUserList user={user as any} key={user.$id} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
