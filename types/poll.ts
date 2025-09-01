import * as z from 'zod';

export const editPollFormSchema = z.object({
  id: z.string(), // Add id for the poll
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  options: z.array(
    z.object({
      id: z.string().optional(), // Add optional id for existing options
      text: z.string().min(1, { message: 'Option cannot be empty.' }),
    })
  ).min(2, {
    message: 'You need at least 2 options.',
  }),
  endDate: z.string().optional(),
  isPublic: z.boolean(),
});

export type EditPollFormValues = z.infer<typeof editPollFormSchema>;

