import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { complete } from '@/actions/conversation'
import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'
import { getAgentModels } from '@/lib/models'

import AgentDetailPage from './agent-detail-page'

export default async function Page({ params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const billing = await getBillingStatusForUser(session.user)

  if (!billing.hasAccess) {
    redirect('/billing')
  }

  const { agentId } = await params
  const models = getAgentModels()

  return (
    <AgentDetailPage
      agentId={agentId}
      endpoint={complete}
      userName={session?.user?.name}
      userImage={session?.user?.image}
      models={models}
    />
  )
}
