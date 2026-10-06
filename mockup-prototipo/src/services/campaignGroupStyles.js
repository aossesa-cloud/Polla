import { buildCampaignStylePayload, getDefaultCampaignStyleForm } from './campaignStyles'

export const CAMPAIGN_STYLE_TYPES = ['diaria', 'semanal', 'mensual']

export function getGroupDefaultStyleForm(group, type) {
  const defaults = group?.tableStyleDefaults
  if (!defaults || typeof defaults !== 'object') return null

  const profile = defaults.mode === 'by-type'
    ? (defaults.byType?.[type] || defaults.shared)
    : defaults.shared

  return profile ? getDefaultCampaignStyleForm({ style: profile }) : null
}

export function getGroupStyleDefaultsFromForms(mode, forms = {}) {
  if (mode === 'by-type') {
    return {
      mode,
      byType: CAMPAIGN_STYLE_TYPES.reduce((profiles, type) => {
        if (forms[type]) profiles[type] = buildCampaignStylePayload(forms[type])
        return profiles
      }, {}),
    }
  }

  return {
    mode: 'shared',
    shared: buildCampaignStylePayload(forms.shared || getDefaultCampaignStyleForm()),
  }
}

export function getGroupStyleForms(group) {
  const defaults = group?.tableStyleDefaults || {}
  const sharedProfile = defaults.shared || defaults.byType?.diaria || defaults.byType?.semanal || defaults.byType?.mensual
  const sharedForm = sharedProfile
    ? getDefaultCampaignStyleForm({ style: sharedProfile })
    : getDefaultCampaignStyleForm()

  return {
    mode: defaults.mode === 'by-type' ? 'by-type' : 'shared',
    forms: CAMPAIGN_STYLE_TYPES.reduce((forms, type) => {
      const profile = defaults.byType?.[type] || sharedProfile
      forms[type] = profile ? getDefaultCampaignStyleForm({ style: profile }) : { ...sharedForm }
      return forms
    }, { shared: { ...sharedForm } }),
  }
}
