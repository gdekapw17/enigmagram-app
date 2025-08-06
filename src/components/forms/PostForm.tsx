import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Models } from 'appwrite';

import {
  useCreatePost,
  useUpdatePost,
  useGetCurrentUser,
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
import { FileUploader, AppLoader } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const PostValidation = z.object({
  caption: z
    .string()
    .min(5, { message: 'Caption must be at least 5 characters.' })
    .max(2200, { message: 'Caption must be less than 2200 characters.' }),
  file: z.custom<File[]>(),
  location: z
    .string()
    .min(1, { message: 'This field is required' })
    .max(1000, { message: 'Location must be less than 1000 characters.' }),
  tags: z.string(),
});

type PostFormProps = {
  post?: Models.Document;
  action: 'Create' | 'Update';
};

const PostForm = ({ post, action = 'Create' }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useGetCurrentUser();

  // Mutations
  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdatePost();

  // Form setup
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post?.caption || '',
      file: [],
      location: post?.location || '',
      tags: post?.tags?.join(', ') || '',
    },
  });

  // Submit handler
  const handleSubmit = async (values: z.infer<typeof PostValidation>) => {
    if (!currentUser) return;

    try {
      if (action === 'Update' && post) {
        // Update existing post
        const updatedPost = await updatePost({
          postId: post.$id,
          caption: values.caption,
          imageId: post.imageId,
          imageUrl: post.imageUrl,
          file: values.file,
          location: values.location,
          tags: values.tags,
        });

        if (!updatedPost) {
          toast({
            title: 'Failed to update post. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        navigate(`/posts/${post.$id}`);
      } else {
        // Create new post
        const newPost = await createPost({
          userId: currentUser.$id,
          caption: values.caption,
          file: values.file,
          location: values.location,
          tags: values.tags,
        });

        if (!newPost) {
          toast({
            title: 'Failed to create post. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        navigate('/');
      }

      toast({
        title: `Post ${action === 'Create' ? 'created' : 'updated'} successfully!`,
      });
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing post:`, error);
      toast({
        title: `Failed to ${action.toLowerCase()} post. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl"
      >
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={(files: File[]) => field.onChange(files)}
                  mediaUrl={post?.imageUrl || ''}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="shad-input"
                  {...field}
                  placeholder="Enter location..."
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma ", ")
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="shad-input"
                  placeholder="Art, Expression, Learn"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(-1)}
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {(isLoadingCreate || isLoadingUpdate) && <AppLoader />}
            {action} Post
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;
