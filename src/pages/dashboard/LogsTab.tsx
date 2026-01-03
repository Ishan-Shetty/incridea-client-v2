import type { Dispatch, SetStateAction } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { WebLogsResponse } from '../../api/admin'
import { formatDateTime } from '../../utils/date'

export interface LogsTabProps {
  webLogsQuery: UseQueryResult<WebLogsResponse, Error>
  logsPage: number
  setLogsPage: Dispatch<SetStateAction<number>>
}

function LogsTab({ webLogsQuery, logsPage, setLogsPage }: LogsTabProps) {
  const logs = webLogsQuery.data?.logs ?? []
  const total = webLogsQuery.data?.total ?? 0
  const pageSize = webLogsQuery.data?.pageSize ?? 50
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      {webLogsQuery.isError ? (
        <p className="text-sm text-rose-300">
          {webLogsQuery.error instanceof Error ? webLogsQuery.error.message : 'Failed to load logs.'}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm text-slate-300">Recent website changes are captured below.</p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover: disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
            disabled={logsPage <= 1 || webLogsQuery.isFetching}
          >
            Prev
          </button>
          <span>Page {logsPage} / {totalPages}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setLogsPage((prev) => prev + 1)}
            disabled={logsPage >= totalPages || webLogsQuery.isFetching}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 ">
        <table className="min-w-full text-sm text-slate-100">
          <thead className=" text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-slate-400" colSpan={3}>
                  {webLogsQuery.isFetching ? 'Loading logs…' : 'No logs yet.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:">
                  <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {log.user ? (
                      <span>
                        {log.user.name ? `${log.user.name} · ` : ''}
                        {log.user.email}
                      </span>
                    ) : (
                      <span className="text-slate-500">Guest / System</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-100 whitespace-pre-wrap wrap-break-word">
                    {log.message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LogsTab
