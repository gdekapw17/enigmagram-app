export type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  save?: Array<{
    $id: string;
    post: { $id: string };
  }>;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

// Add this new interface for Post
export interface IPost {
  $id: string;
  $createdAt: string;
  $updatedAt?: string;
  caption?: string;
  imageUrl: string; // This is the main property your API uses
  imageId: string;
  location?: string;
  tags?: string[];
  creator: {
    $id: string;
    name: string;
    imageUrl?: string;
    username?: string;
    email?: string;
  };
  likes?: any[];
  likesCount?: number;
}

export interface IFollow {
  $id: string;
  follower: string;
  following: string;
  $createdAt: string;
}

export interface IFollowUser {
  followerId: string;
  followingId: string;
}
