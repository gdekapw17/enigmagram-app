import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useGetCurrentUser,
  useUpdateUserProfile,
  useGetUserById,
} from '@/lib/tanstack-query/queriesAndMutations';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppLoader } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { ProfileValidation } from '@/lib/validation';

const UpdateProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string>('');

  // Queries
  const { data: currentUser } = useGetCurrentUser();
  const { data: user, isLoading: isUserLoading } = useGetUserById(id || '');

  // Mutations
  const { mutateAsync: updateUserProfile, isPending: isLoadingUpdate } =
    useUpdateUserProfile();

  // Form setup
  const form = useForm<z.infer<typeof ProfileValidation>>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      file: [],
    },
  });

  // Update default values when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        bio: user.bio || '',
        file: [],
      });
    }
  }, [user, form]);

  // Check if current user can edit this profile
  const canEdit = currentUser?.$id === id;

  // Redirect if user can't edit
  useEffect(() => {
    if (currentUser && !canEdit && !isUserLoading) {
      toast({
        title: 'Access denied',
        description: 'You can only edit your own profile.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [currentUser, canEdit, isUserLoading, navigate, toast]);

  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      // Create preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Update form field
      form.setValue('file', files);
    }
  };

  // Submit handler
  const handleSubmit = async (values: z.infer<typeof ProfileValidation>) => {
    if (!currentUser || !user) return;

    try {
      const updatedUser = await updateUserProfile({
        userId: user.$id,
        name: values.name,
        bio: values.bio || '',
        imageId: user.imageId,
        imageUrl: user.imageUrl,
        file: values.file,
      });

      if (!updatedUser) {
        toast({
          title: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Profile updated successfully!',
      });

      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }

      // Navigate back to profile
      navigate(`/profile/${user.$id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isUserLoading) {
    return (
      <div className="flex-center w-full h-full">
        <AppLoader />
      </div>
    );
  }

  // User not found
  if (!user) {
    return (
      <div className="flex-center w-full h-full">
        <p className="body-medium text-light-1">User not found</p>
      </div>
    );
  }

  // Access denied
  if (!canEdit) {
    return (
      <div className="flex-center w-full h-full">
        <p className="body-medium text-light-1">Access denied</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <img
            src="/assets/icons/edit.svg"
            width={36}
            height={36}
            alt="edit"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Profile</h2>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-7 w-full mt-4 max-w-5xl"
          >
            {/* Profile Picture */}
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel className="shad-form_label">
                    Profile Image
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {/* Current Profile Image Preview */}
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-dark-4 border-2 border-dark-4">
                        <img
                          src={
                            previewImage ||
                            user?.imageUrl ||
                            '/assets/icons/profile-placeholder.svg'
                          }
                          alt="profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Custom Compact File Input */}
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const files = e.target.files
                              ? Array.from(e.target.files)
                              : [];
                            handleFileChange(files);
                          }}
                          className="hidden"
                          id="profile-upload"
                        />
                        <label
                          htmlFor="profile-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-dark-4 hover:bg-dark-3 transition-colors cursor-pointer rounded-lg text-light-1 text-sm"
                        >
                          <img
                            src="/assets/icons/file-upload.svg"
                            alt="upload"
                            width={16}
                            height={16}
                            className="invert-white"
                          />
                          {previewImage && previewImage !== user?.imageUrl
                            ? 'Change Photo'
                            : 'Choose Photo'}
                        </label>
                        <p className="text-light-4 text-xs">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="shad-input"
                      {...field}
                      placeholder="Enter your name..."
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Username (readonly) */}
            <div className="flex flex-col gap-2">
              <label className="shad-form_label">Username</label>
              <Input
                type="text"
                value={`@${user.username}`}
                className="shad-input opacity-50"
                disabled
                readOnly
              />
              <p className="text-light-4 text-sm">Username cannot be changed</p>
            </div>

            {/* Email (readonly) */}
            <div className="flex flex-col gap-2">
              <label className="shad-form_label">Email</label>
              <Input
                type="email"
                value={user.email}
                className="shad-input opacity-50"
                disabled
                readOnly
              />
              <p className="text-light-4 text-sm">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form_label">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      className="shad-textarea custom-scrollbar"
                      {...field}
                      placeholder="Tell us about yourself..."
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-4 items-center justify-end">
              <Button
                type="button"
                className="shad-button_dark_4"
                onClick={() => navigate(`/profile/${user.$id}`)}
                disabled={isLoadingUpdate}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="shad-button_primary whitespace-nowrap cursor-pointer"
                disabled={isLoadingUpdate}
              >
                {isLoadingUpdate && <AppLoader />}
                Update Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UpdateProfile;
