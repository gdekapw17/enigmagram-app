import PostForm from '@/components/forms/PostForm';

const CreatePost = () => {
  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img
            src="/assets/icons/add-post.svg"
            width={36}
            height={36}
            alt="add-post-icon"
          />
          <h2 className="h3-bold md:h2-bold">Create Post</h2>
        </div>

        <PostForm />
      </div>
    </div>
  );
};

export default CreatePost;
