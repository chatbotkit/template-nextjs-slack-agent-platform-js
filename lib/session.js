import { getServerSession } from 'next-auth'

import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'

import 'server-only'

/**
 * Returns the authenticated, subscribed session or throws.
 *
 * @returns {Promise<{ session: object, billing: object }>}
 */
export async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  const billing = await getBillingStatusForUser(session.user)

  if (!billing.hasAccess) {
    throw new Error('Subscription required')
  }

  return { session, billing }
}
