import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Setting, SettingsResponse } from '../../api/admin'

export interface SettingsTabProps {
  settingsQuery: UseQueryResult<SettingsResponse, Error>
  settings: Setting[]
  updateSettingMutation: UseMutationResult<unknown, Error, { key: string; value: boolean }>
}

function SettingsTab({ settingsQuery, settings, updateSettingMutation }: SettingsTabProps) {
  return (
    <div className="space-y-4">
      {settingsQuery.isError ? (
        <p className="text-sm text-rose-300">
          {settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Failed to load settings.'}
        </p>
      ) : null}
      {settings.length === 0 ? <p className="text-sm text-slate-300">No settings found.</p> : null}
      {settings.map((setting) => (
        <div
          key={setting.key}
          className="flex items-center justify-between rounded-lg border border-slate-800  px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-slate-100">{setting.key}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-slate-400">{setting.value ? 'On' : 'Off'}</span>
                <button
                type="button"
                aria-pressed={setting.value}
                onClick={() =>
                    updateSettingMutation.mutate({
                    key: setting.key,
                    value: !setting.value,
                    })
                }
                disabled={updateSettingMutation.isPending}
                className={`px-4 py-4 rounded-full font-medium text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300
                    ${setting.value ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    ${updateSettingMutation.isPending ? 'cursor-not-allowed opacity-60' : ''}
                `}
                >
                </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SettingsTab
