import type { Models } from 'appwrite';
import React from 'react';

type GridPostListProps = {
  posts: Models.Document[];
};
const GridPostList = ({ posts }: GridPostListProps) => {
  return (
    <div>
      {posts.map((post) => (
        <p>{post.caption}</p>
      ))}
    </div>
  );
};

export default GridPostList;
