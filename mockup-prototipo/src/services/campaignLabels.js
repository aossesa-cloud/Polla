export function getCampaignGroupName(campaign, appData) {
  const groupId = String(campaign?.groupId || campaign?.group || '').trim()
  const explicitGroupName = String(campaign?.groupName || campaign?.registryGroupName || '').trim()
  if (!groupId) return explicitGroupName

  const groups = [
    ...(Array.isArray(appData?.registryGroups) ? appData.registryGroups : []),
    ...(Array.isArray(appData?.settings?.registryGroups) ? appData.settings.registryGroups : []),
  ]

  const group = groups.find((item) => String(item?.id || '').trim() === groupId)
  return String(group?.name || explicitGroupName || groupId).trim()
}

export function formatCampaignDisplayName(campaign, appData) {
  const campaignName = String(campaign?.name || 'Sin nombre').trim()
  const groupName = getCampaignGroupName(campaign, appData)
  return groupName ? `${campaignName} (${groupName})` : campaignName
}
