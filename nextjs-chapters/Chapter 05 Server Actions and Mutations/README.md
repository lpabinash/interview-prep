# Chapter 05 — Server Actions and Mutations

## What Are Server Actions?

Server Actions are **async functions that run on the server**. They let you handle form submissions and data mutations without creating API endpoints.

```tsx
// app/page.tsx
export default function Page() {
  async function createPost(formData: FormData) {
    'use server'; // This marks the function as a Server Action

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    await db.post.create({
      data: { title, content },
    });
  }

  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

---

## Defining Server Actions

### Inline in Server Components

```tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server';
    // Server-side logic here
  }

  return <form action={handleSubmit}>...</form>;
}
```

### In a Separate File (Recommended)

```tsx
// app/actions.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await db.user.create({ data: { name, email } });
  revalidatePath('/users');
}

export async function deleteUser(id: number) {
  await db.user.delete({ where: { id } });
  revalidatePath('/users');
}
```

```tsx
// app/users/page.tsx
import { createUser } from '../actions';

export default function UsersPage() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Add User</button>
    </form>
  );
}
```

---

## Using with Client Components

```tsx
'use client';

import { useActionState } from 'react';
import { createPost } from '@/app/actions';

type State = {
  message: string;
  errors?: { title?: string[]; content?: string[] };
};

export default function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: State, formData: FormData): Promise<State> => {
      const result = await createPost(formData);
      return result;
    },
    { message: '' }
  );

  return (
    <form action={formAction}>
      <input name="title" disabled={isPending} />
      {state.errors?.title && <p className="text-red-500">{state.errors.title[0]}</p>}

      <textarea name="content" disabled={isPending} />
      {state.errors?.content && <p className="text-red-500">{state.errors.content[0]}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

---

## Form Validation

### Server-Side Validation

```tsx
// app/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

export async function createUser(prevState: any, formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed',
    };
  }

  const { name, email } = validatedFields.data;

  try {
    await db.user.create({ data: { name, email } });
    revalidatePath('/users');
    return { message: 'User created successfully!' };
  } catch (error) {
    return { message: 'Database error. Please try again.' };
  }
}
```

---

## Revalidation

After mutating data, tell Next.js to refresh:

### `revalidatePath`

```tsx
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.post.create({ /* ... */ });

  revalidatePath('/blog');          // Revalidate a specific path
  revalidatePath('/blog', 'layout'); // Revalidate including layout
  revalidatePath('/', 'layout');    // Revalidate everything
}
```

### `revalidateTag`

```tsx
'use server';

import { revalidateTag } from 'next/cache';

export async function updatePost(id: number, formData: FormData) {
  await db.post.update({ where: { id }, data: { /* ... */ } });

  revalidateTag('posts');   // Revalidate all fetches tagged 'posts'
  revalidateTag(`post-${id}`); // Revalidate specific post
}
```

Works with tagged fetches:

```tsx
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});
```

---

## Redirecting

```tsx
'use server';

import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const post = await db.post.create({ /* ... */ });
  redirect(`/blog/${post.slug}`); // Navigate after mutation
}
```

---

## Optimistic Updates

Update the UI immediately before the server responds:

```tsx
'use client';

import { useOptimistic } from 'react';
import { addTodo } from '@/app/actions';

type Todo = { id: number; text: string; completed: boolean };

export default function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state: Todo[], newTodo: string) => [
      ...state,
      { id: Date.now(), text: newTodo, completed: false },
    ]
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimisticTodo(text);       // Instant UI update
    await addTodo(formData);       // Server mutation
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="text" placeholder="Add todo..." />
        <button type="submit">Add</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Non-Form Server Actions

Server Actions can be called outside of forms:

```tsx
'use client';

import { toggleLike } from '@/app/actions';

export default function LikeButton({ postId }: { postId: number }) {
  return (
    <button onClick={async () => {
      await toggleLike(postId);
    }}>
      ❤️ Like
    </button>
  );
}
```

```tsx
// app/actions.ts
'use server';

export async function toggleLike(postId: number) {
  await db.like.toggle({ postId });
  revalidatePath('/blog');
}
```

---

## Error Handling

```tsx
'use server';

export async function deletePost(id: number) {
  try {
    await db.post.delete({ where: { id } });
    revalidatePath('/blog');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete post' };
  }
}
```

Errors thrown in Server Actions are caught by the nearest `error.tsx` boundary.

---

## Summary

| Concept | Usage |
|---|---|
| `'use server'` | Marks function as Server Action |
| `form action` | Bind Server Action to form |
| `useActionState` | Track pending state and errors |
| `useOptimistic` | Optimistic UI updates |
| `revalidatePath` | Refresh a specific route |
| `revalidateTag` | Refresh tagged fetches |
| `redirect` | Navigate after mutation |
| Zod validation | Type-safe server-side validation |
