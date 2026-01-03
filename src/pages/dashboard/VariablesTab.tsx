import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Variable, VariablesResponse } from '../../api/admin'

export interface VariablesTabProps {
  variablesQuery: UseQueryResult<VariablesResponse, Error>
  variables: Variable[]
  editingKey: string | null
  setEditingKey: (key: string | null) => void
  variableDrafts: Record<string, string>
  setVariableDrafts: (drafts: Record<string, string>) => void
  upsertVariableMutation: UseMutationResult<unknown, Error, { key: string; value: string }>
}

function VariablesTab({
  variablesQuery,
  variables,
  editingKey,
  setEditingKey,
  variableDrafts,
  setVariableDrafts,
  upsertVariableMutation,
}: VariablesTabProps) {
  return (
    <div className="space-y-5">


      <div className="space-y-3">
        {variablesQuery.isError ? (
          <p className="text-sm text-rose-300">
            {variablesQuery.error instanceof Error ? variablesQuery.error.message : 'Failed to load variables.'}
          </p>
        ) : null}
        {variables.length === 0 ? <p className="text-sm text-slate-300">No variables yet.</p> : null}
        {variables.map((variable) => (
          <div
            key={variable.key}
            className="rounded-xl border border-slate-800  p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-100">{variable.key}</p>

                {editingKey === variable.key ? (
                  <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      className="input"
                      value={variableDrafts[variable.key] ?? ''}
                      onChange={(event) =>
                        setVariableDrafts({ ...variableDrafts, [variable.key]: event.target.value })
                      }
                    />
                    <div className="flex gap-2 sm:w-48">
                      <button
                        className="button sm:flex-1"
                        type="button"
                        onClick={() =>
                          upsertVariableMutation.mutate({
                            key: variable.key,
                            value: variableDrafts[variable.key] ?? '',
                          })
                        }
                        disabled={upsertVariableMutation.isPending}
                      >
                        {upsertVariableMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover: sm:flex-1"
                        onClick={() => {
                          setVariableDrafts({ ...variableDrafts, [variable.key]: variable.value })
                          setEditingKey(null)
                        }}
                        disabled={upsertVariableMutation.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 break-all">{variable.value}</p>
                )}
              </div>

              {editingKey === variable.key ? null : (
                <button
                  className="button sm:w-24"
                  type="button"
                  onClick={() => setEditingKey(variable.key)}
                  disabled={upsertVariableMutation.isPending}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VariablesTab
