import { AppLoader, PostCard } from '@/components/shared';
import { useGetRecentPosts } from '@/lib/tanstack-query/queriesAndMutations';
import type { Models } from 'appwrite';

const Home = () => {
  const {
    data: posts,
    isPending: isPostLoading,
    isError: isPostError,
  } = useGetRecentPosts();

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
                <li>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
