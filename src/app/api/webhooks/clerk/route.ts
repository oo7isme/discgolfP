import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  // Upsert helper to normalize Clerk user to our Convex schema
  const upsertFromClerk = async (clerkUser: any) => {
    const id = clerkUser?.id;
    const email = clerkUser?.email_addresses?.[0]?.email_address || clerkUser?.primary_email_address_id || '';
    const username = clerkUser?.username || undefined;
    const name = (
      clerkUser?.first_name || clerkUser?.last_name
        ? `${clerkUser?.first_name || ''} ${clerkUser?.last_name || ''}`.trim()
        : clerkUser?.full_name
    ) || undefined;
    const image = clerkUser?.image_url || undefined;

    if (!id) return;

    try {
      // Try create; if it exists, update
      await convex.mutation(api.users.createUser, {
        email,
        username,
        name,
        image,
        clerkId: id,
      });
    } catch (e) {
      // Fall back to update when user already exists
      await convex.mutation(api.users.updateUser, {
        clerkId: id,
        username,
        name,
        image,
      });
    }
  };

  if (eventType === 'user.created') {
    await upsertFromClerk(evt.data);
  } else if (eventType === 'user.updated') {
    await upsertFromClerk(evt.data);
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data as any;
    
    if (!id) {
      console.error('No user ID in webhook data');
      return new Response('No user ID provided', {
        status: 400,
      });
    }
    
    try {
      // Delete user from Convex database
      await convex.mutation(api.users.deleteUser, {
        clerkId: id,
      });
      
      console.log(`User ${id} deleted from Convex database`);
    } catch (error) {
      console.error('Error deleting user from Convex:', error);
      return new Response('Error deleting user', {
        status: 500,
      });
    }
  }

  return new Response('', { status: 200 });
}
