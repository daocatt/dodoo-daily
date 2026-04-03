'use client'

import React from 'react'
import ParentDashboard from '../page'

/**
 * Route: /admin/console/members
 * Explicit route for family member management.
 * Wraps the ParentDashboard and forces the FAMILY view.
 */
export default function MembersRoute() {
    return <ParentDashboard forceView="FAMILY" />
}
