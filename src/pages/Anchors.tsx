import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export function Anchors() {
  return (
    <>
      <PageHeader title="Anchor lifts" subtitle="Coming in Phase 3" />
      <Button render={<Link to="/" />}>Skip for now</Button>
    </>
  )
}
