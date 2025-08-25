export const QUERY_KEYS = {
  // AUTH KEYS
  CREATE_USER_ACCOUNT: 'createUserAccount',

  // USER KEYS
  GET_CURRENT_USER: 'getCurrentUser',
  GET_TOP_USERS: 'getTopUsers',
  SEARCH_USERS: 'searchUsers',
  GET_ALL_USERS: 'getAllUsers',
  GET_USER_BY_ID: 'getUserById',
  GET_USER_BY_USERNAME: 'getUserByUsername',
  GET_USER_FOLLOWERS: 'getUserFollowers',
  GET_USER_FOLLOWING: 'getUserFollowing',
  CHECK_IS_FOLLOWING: 'checkIsFollowing',
  GET_INFINITE_USER_POSTS: 'getInfiniteUserPosts',
  GET_USER_LIKED_POSTS: 'getUserLikedPosts',
  GET_INFINITE_USER_LIKED_POSTS: 'getInfiniteUserLikedPosts',
  GET_USER_PROFILE_STATS: 'getUserProfileStats',
  GET_USER_ACTIVITY_SUMMARY: 'getUserActivitySummary',
  CHECK_USERNAME_AVAILABILITY: 'checkUsernameAvailability',
  UPDATE_USER_PROFILE: 'updateUserProfile',
  GET_USER_STATS: 'getUserStats',

  // POST KEYS
  GET_POSTS: 'getPosts',
  GET_INFINITE_POSTS: 'getInfinitePosts',
  GET_RECENT_POSTS: 'getRecentPosts',
  GET_POST_BY_ID: 'getPostById',
  GET_USER_POSTS: 'getUserPosts',
  GET_FILE_PREVIEW: 'getFilePreview',
  GET_SAVED_POSTS: 'getSavedPosts',
  CHECK_USER_LIKED_POST: 'checkUserLikedPost',
  GET_POST_LIKES: 'getPostLikes',

  //  SEARCH KEYS
  SEARCH_POSTS: 'getSearchPosts',
  SEARCH_POSTS_BY_HASHTAG: 'searchPostsByHashtag',
  GET_TRENDING_HASHTAGS: 'getTrendingHashtags',
  ADVANCED_SEARCH_POSTS: 'advancedSearchPosts',
} as const;
