import {
  useGetSavedPosts,
  useGetCurrentUser,
} from '@/lib/tanstack-query/queriesAndMutations';

const Saved = () => {
  const { data: currentUser } = useGetCurrentUser();
  const {
    data: savedPosts,
    isLoading,
    error,
  } = useGetSavedPosts(currentUser?.$id);

  if (isLoading) return <div>Loading saved posts...</div>;

  if (error) return <div>Error loading saved posts</div>;

  if (!savedPosts?.documents?.length) {
    return <div>No saved posts yet</div>;
  }

  return (
    <div className="saved-posts">
      <h2>Saved Posts ({savedPosts.total})</h2>
      <div className="posts-grid">
        {savedPosts.documents.map((savedPost: any) => (
          <div key={savedPost.$id} className="post-card">
            {/* Render post content dari savedPost.post */}
            <img src={savedPost.post.imageUrl} alt={savedPost.post.caption} />
            <p>{savedPost.post.caption}</p>
            <small>
              Saved on: {new Date(savedPost.$createdAt).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Saved;
