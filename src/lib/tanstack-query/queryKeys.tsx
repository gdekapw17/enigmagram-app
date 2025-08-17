export const QUERY_KEYS = {
  // AUTH KEYS
  CREATE_USER_ACCOUNT: 'createUserAccount',

  // USER KEYS
  GET_CURRENT_USER: 'getCurrentUser',
  GET_TOP_USERS: 'getTopUsers',
  SEARCH_USERS: 'searchUsers',
  GET_ALL_USERS: 'getAllUsers',
  GET_USER_BY_ID: 'getUserById',
  GET_USER_FOLLOWERS: 'getUserFollowers',
  GET_USER_FOLLOWING: 'getUserFollowing',
  CHECK_IS_FOLLOWING: 'checkIsFollowing',

  // POST KEYS
  GET_POSTS: 'getPosts',
  GET_INFINITE_POSTS: 'getInfinitePosts',
  GET_RECENT_POSTS: 'getRecentPosts',
  GET_POST_BY_ID: 'getPostById',
  GET_USER_POSTS: 'getUserPosts',
  GET_FILE_PREVIEW: 'getFilePreview',
  GET_SAVED_POSTS: 'getSavedPosts',

  //  SEARCH KEYS
  SEARCH_POSTS: 'getSearchPosts',
} as const;
