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
