import { ID, Query } from 'appwrite';

import type { INewUser, IUpdatePost } from '@/types';
import { account, appwriteConfig, avatars, databases, storage } from './config';

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name,
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      email: newAccount.email,
      name: newAccount.name,
      imageUrl: avatarUrl,
      username: user.username,
    });

    return newUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: string;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user,
    );

    return newUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password,
    );

    return session;
  } catch (error) {
    console.log(error);
  }
}

export async function getCurrentUser() {
  try {
    const currentAcount = await account.get();

    if (!currentAcount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAcount.$id)],
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession('current');

    return session;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file,
    );

    await storage.updateFile(
      appwriteConfig.storageId,
      uploadedFile.$id,
      'role:all',
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createPost(post: {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
}) {
  try {
    // 1. Unggah file terlebih dahulu
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error('File upload failed');

    // 2. Dapatkan URL file yang sudah diunggah
    const fileUrl = getFileViewUrl(uploadedFile.$id);

    if (!fileUrl) {
      deleteFile(uploadedFile.$id);
      throw Error('Failed to get file URL');
    }

    // 3. Ubah string tags menjadi array
    const tags = post.tags?.replace(/ /g, '').split(',');

    // 4. Buat dokumen postingan di database
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location || '',
        tags: tags || '',
      },
    );

    if (!newPost) {
      deleteFile(uploadedFile.$id);
      throw Error('Failed to create post');
    }

    return newPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export function getFileViewUrl(fileId: string): string {
  try {
    const url = storage.getFileView(appwriteConfig.storageId, fileId);
    return url.toString(); // Konversi URL object ke string
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(20)],
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      },
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      },
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId,
    );

    if (!statusCode) throw Error;

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getPostById(postId: string) {
  if (!postId) return;

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl, // Sudah bertipe URL | string
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload file baru
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error('File upload failed');

      // Dapatkan URL file baru
      const fileUrl = getFileViewUrl(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error('Failed to get file URL');
      }

      // Update image object dengan URL string
      image = {
        ...image,
        imageUrl: fileUrl.toString(), // ← Konversi ke string jika perlu
        imageId: uploadedFile.$id,
      };
    }

    // Convert tags
    const tags = post.tags?.replace(/ /g, '').split(',') || [];

    // Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      },
    );

    // Hapus file lama jika ada file baru yang berhasil diupload
    if (hasFileToUpdate && updatedPost) {
      await deleteFile(post.imageId);
    }

    if (!updatedPost) {
      // Jika gagal update, hapus file baru
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw Error('Failed to update post');
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)];

  if (pageParam) {
    // pageParam adalah document ID, bukan number
    queries.push(Query.cursorAfter(pageParam)); // Hapus .toString()
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries,
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log('getInfinitePosts error:', error);
    throw error;
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return { documents: [] };
    }

    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    // If search term starts with #, search hashtags specifically
    if (cleanSearchTerm.startsWith('#')) {
      const hashtag = cleanSearchTerm.substring(1); // Remove # symbol
      return await searchPostsByHashtag(hashtag);
    }

    // For regular search, get all posts and filter them
    const allPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(100), // Get more posts to filter through
      ],
    );

    if (!allPosts || !allPosts.documents) {
      return { documents: [] };
    }

    // Filter posts based on search criteria
    const filteredPosts = allPosts.documents.filter((post: any) => {
      const caption = (post.caption || '').toLowerCase();
      const location = (post.location || '').toLowerCase();
      const tags = Array.isArray(post.tags)
        ? post.tags.join(' ').toLowerCase()
        : '';
      const creatorName = (post.creator?.name || '').toLowerCase();
      const creatorUsername = (post.creator?.username || '').toLowerCase();

      return (
        caption.includes(cleanSearchTerm) ||
        location.includes(cleanSearchTerm) ||
        tags.includes(cleanSearchTerm) ||
        creatorName.includes(cleanSearchTerm) ||
        creatorUsername.includes(cleanSearchTerm)
      );
    });

    return {
      documents: filteredPosts.slice(0, 20), // Limit results
      total: filteredPosts.length,
    };
  } catch (error) {
    console.log('Search posts error:', error);
    return { documents: [] };
  }
}

export async function searchPostsByHashtag(hashtag: string) {
  try {
    if (!hashtag || hashtag.trim() === '') {
      return { documents: [] };
    }

    const cleanHashtag = hashtag.trim().toLowerCase();

    // Get all posts to filter by hashtag
    const allPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(100)],
    );

    if (!allPosts || !allPosts.documents) {
      return { documents: [] };
    }

    // Filter posts that contain the hashtag
    const filteredPosts = allPosts.documents.filter((post: any) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      return tags.some((tag: string) =>
        tag.toLowerCase().includes(cleanHashtag),
      );
    });

    return {
      documents: filteredPosts.slice(0, 20),
      total: filteredPosts.length,
    };
  } catch (error) {
    console.log('Search hashtag error:', error);
    return { documents: [] };
  }
}

export async function getTrendingHashtags(limit: number = 10) {
  try {
    // Get recent posts
    const recentPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(100), // Get recent posts to analyze hashtags
      ],
    );

    if (!recentPosts || !recentPosts.documents) {
      return [];
    }

    // Count hashtag frequency
    const hashtagCount: { [key: string]: number } = {};

    recentPosts.documents.forEach((post: any) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag) {
            hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by frequency
    const trendingHashtags = Object.entries(hashtagCount)
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return trendingHashtags;
  } catch (error) {
    console.log('Get trending hashtags error:', error);
    return [];
  }
}

export async function advancedSearchPosts(searchOptions: {
  query?: string;
  hashtags?: string[];
  location?: string;
  creator?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const { query, hashtags, location, creator, dateFrom, dateTo } =
      searchOptions;

    // Build Appwrite queries
    const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(50)];

    // Add date filters if provided
    if (dateFrom) {
      queries.push(Query.greaterThanEqual('$createdAt', dateFrom));
    }
    if (dateTo) {
      queries.push(Query.lessThanEqual('$createdAt', dateTo));
    }

    // Get posts
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries,
    );

    if (!posts || !posts.documents) {
      return { documents: [] };
    }

    // Filter posts based on search criteria
    let filteredPosts = posts.documents;

    // Filter by text query
    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filteredPosts = filteredPosts.filter((post: any) => {
        const caption = (post.caption || '').toLowerCase();
        const postLocation = (post.location || '').toLowerCase();
        const tags = Array.isArray(post.tags)
          ? post.tags.join(' ').toLowerCase()
          : '';

        return (
          caption.includes(searchTerm) ||
          postLocation.includes(searchTerm) ||
          tags.includes(searchTerm)
        );
      });
    }

    // Filter by hashtags
    if (hashtags && hashtags.length > 0) {
      const cleanHashtags = hashtags.map((tag) =>
        tag.toLowerCase().replace('#', ''),
      );
      filteredPosts = filteredPosts.filter((post: any) => {
        const postTags = Array.isArray(post.tags)
          ? post.tags.map((t: string) => t.toLowerCase())
          : [];
        return cleanHashtags.some((hashtag) =>
          postTags.some((postTag: string) => postTag.includes(hashtag)),
        );
      });
    }

    // Filter by location
    if (location && location.trim()) {
      const searchLocation = location.trim().toLowerCase();
      filteredPosts = filteredPosts.filter((post: any) => {
        const postLocation = (post.location || '').toLowerCase();
        return postLocation.includes(searchLocation);
      });
    }

    // Filter by creator
    if (creator && creator.trim()) {
      const searchCreator = creator.trim().toLowerCase();
      filteredPosts = filteredPosts.filter((post: any) => {
        const creatorName = (post.creator?.name || '').toLowerCase();
        const creatorUsername = (post.creator?.username || '').toLowerCase();
        return (
          creatorName.includes(searchCreator) ||
          creatorUsername.includes(searchCreator)
        );
      });
    }

    return {
      documents: filteredPosts.slice(0, 20),
      total: filteredPosts.length,
    };
  } catch (error) {
    console.log('Advanced search error:', error);
    return { documents: [] };
  }
}

export async function getSavedPosts(userId: string) {
  try {
    const savedPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [
        Query.equal('user', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ],
    );

    if (!savedPosts) throw Error;

    return savedPosts;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getTopUsers() {
  try {
    // Ambil semua users dengan limit
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(10), // Ambil lebih banyak untuk sorting
      ],
    );

    if (!users) throw Error;

    // Untuk setiap user, hitung statistik mereka
    const usersWithStats = await Promise.all(
      users.documents.map(async (user) => {
        try {
          // Hitung jumlah posts user
          const userPosts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [
              Query.equal('creator', user.$id),
              Query.limit(1), // Hanya untuk count
            ],
          );

          // Hitung total likes dari semua posts user
          const allUserPosts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.equal('creator', user.$id), Query.limit(100)],
          );

          const totalLikes = allUserPosts.documents.reduce((total, post) => {
            return total + (post.likes?.length || 0);
          }, 0);

          // ✅ Hitung followers
          const followers = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            [
              Query.equal('following', user.$id),
              Query.limit(1), // Hanya untuk count
            ],
          );

          const totalPosts = userPosts.total || 0;
          const totalFollowers = followers.total || 0;

          return {
            ...user,
            postsCount: totalPosts,
            likesCount: totalLikes,
            followersCount: totalFollowers, // ✅ Tambahkan follower count
            score: totalPosts * 2 + totalLikes + totalFollowers, // ✅ Update formula scoring
          };
        } catch (error) {
          console.log(`Error calculating stats for user ${user.$id}:`, error);
          return {
            ...user,
            postsCount: 0,
            likesCount: 0,
            followersCount: 0,
            score: 0,
          };
        }
      }),
    );

    const topUsers = usersWithStats
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      documents: topUsers,
      total: topUsers.length,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function searchUsers(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return { documents: [] };
    }

    const cleanSearchTerm = searchTerm.trim();
    if (cleanSearchTerm.length < 2) {
      return { documents: [] };
    }

    console.log('Searching for:', cleanSearchTerm);

    // Get all users
    const allUsers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.limit(100), Query.orderDesc('$createdAt')],
    );

    if (!allUsers || !allUsers.documents) {
      return { documents: [] };
    }

    // Filter users based on search term
    const filteredUsers = allUsers.documents.filter((user: any) => {
      const name = (user.name || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const searchLower = cleanSearchTerm.toLowerCase();

      return (
        name.includes(searchLower) ||
        username.includes(searchLower) ||
        email.includes(searchLower)
      );
    });

    // Add stats to each filtered user (same logic as getTopUsers)
    const usersWithStats = await Promise.all(
      filteredUsers.map(async (user: any) => {
        try {
          // Count user posts
          const userPosts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [
              Query.equal('creator', user.$id),
              Query.limit(1), // Just for count
            ],
          );

          // Get all user posts to calculate likes
          const allUserPosts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.equal('creator', user.$id), Query.limit(100)],
          );

          const totalLikes = allUserPosts.documents.reduce(
            (total: number, post: any) => {
              return total + (post.likes?.length || 0);
            },
            0,
          );

          const totalPosts = userPosts.total || 0;

          return {
            ...user,
            postsCount: totalPosts,
            likesCount: totalLikes,
            score: totalPosts * 2 + totalLikes,
          };
        } catch (error) {
          console.log(`Error calculating stats for user ${user.$id}:`, error);
          return {
            ...user,
            postsCount: 0,
            likesCount: 0,
            score: 0,
          };
        }
      }),
    );

    console.log('Users with stats:', usersWithStats);

    return {
      documents: usersWithStats.slice(0, 20), // Limit to 20 results
      total: usersWithStats.length,
    };
  } catch (error) {
    console.log('Search users error:', error);
    return { documents: [] };
  }
}

export async function getAllUsers({ pageParam }: { pageParam?: string }) {
  const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(20)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries,
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function followUser(followerId: string, followingId: string) {
  try {
    const newFollow = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      ID.unique(),
      {
        follower: followerId,
        following: followingId,
      },
    );

    if (!newFollow) throw Error;

    return newFollow;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function unfollowUser(followRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followRecordId,
    );

    if (!statusCode) throw Error;

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserFollowers(userId: string) {
  try {
    const followers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal('following', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    );

    if (!followers) throw Error;

    return followers;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserFollowing(userId: string) {
  try {
    const following = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal('follower', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    );

    if (!following) throw Error;

    return following;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function checkIsFollowing(
  followerId: string,
  followingId: string,
) {
  try {
    const followRecord = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal('follower', followerId),
        Query.equal('following', followingId),
        Query.limit(1),
      ],
    );

    return followRecord.documents.length > 0 ? followRecord.documents[0] : null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getUserById(userId: string) {
  if (!userId) return;

  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserPosts(userId: string) {
  if (!userId) return;

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal('creator', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ],
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserLikedPosts(userId: string) {
  if (!userId) return;

  try {
    // Get all posts first
    const allPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(100)],
    );

    if (!allPosts) throw Error;

    // Filter posts that are liked by the user
    const likedPosts = allPosts.documents.filter((post: any) => {
      return post.likes && post.likes.includes(userId);
    });

    return {
      documents: likedPosts,
      total: likedPosts.length,
    };
  } catch (error) {
    console.log('Get user liked posts error:', error);
    return { documents: [] };
  }
}

export async function updateUserProfile(user: {
  userId: string;
  name: string;
  bio?: string;
  imageId?: string;
  imageUrl?: string;
  file: File[];
}) {
  const hasFileToUpdate = user.file && user.file.length > 0;

  try {
    let image = {
      imageUrl: user.imageUrl || '',
      imageId: user.imageId || '',
    };

    if (hasFileToUpdate) {
      // Upload new file
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error('File upload failed');

      // Get file URL
      const fileUrl = getFileViewUrl(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error('Failed to get file URL');
      }

      // Update image object
      image = {
        imageUrl: fileUrl.toString(),
        imageId: uploadedFile.$id,
      };
    }

    // Update user document
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio || '',
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      },
    );

    // Delete old file if new file was uploaded successfully
    if (hasFileToUpdate && updatedUser && user.imageId) {
      await deleteFile(user.imageId);
    }

    if (!updatedUser) {
      // If update failed, delete new file
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw Error('Failed to update user');
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserStats(userId: string) {
  if (!userId) return null;

  try {
    // Get user posts count
    const userPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [
        Query.equal('creator', userId),
        Query.limit(1), // Just for count
      ],
    );

    // Get followers count
    const followers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal('following', userId),
        Query.limit(1), // Just for count
      ],
    );

    // Get following count
    const following = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal('follower', userId),
        Query.limit(1), // Just for count
      ],
    );

    // Calculate total likes received on all posts
    const allUserPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal('creator', userId), Query.limit(100)],
    );

    const totalLikesReceived = allUserPosts.documents.reduce(
      (total, post: any) => {
        return total + (post.likes?.length || 0);
      },
      0,
    );

    return {
      postsCount: userPosts.total || 0,
      followersCount: followers.total || 0,
      followingCount: following.total || 0,
      likesReceived: totalLikesReceived,
    };
  } catch (error) {
    console.log('Get user stats error:', error);
    return {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
    };
  }
}
