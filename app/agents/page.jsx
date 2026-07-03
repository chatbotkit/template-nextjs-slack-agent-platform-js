import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'
import { getAgentModels } from '@/lib/models'

import AgentsPage from './agents-page'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const billing = await getBillingStatusForUser(session.user)

  if (!billing.hasAccess) {
    redirect('/billing')
  }

  const models = getAgentModels()

  return <AgentsPage models={models} />
}
