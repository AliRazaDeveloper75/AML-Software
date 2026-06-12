import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useComplianceSocket({ onAlert } = {}) {
  const qc = useQueryClient()
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host
    const url = `${protocol}://${host}/ws/compliance/?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'aml_alert' || msg.type === 'compliance_message') {
          qc.invalidateQueries({ queryKey: ['aml-alert-summary'] })
          qc.invalidateQueries({ queryKey: ['aml-alerts'] })
          qc.invalidateQueries({ queryKey: ['monitoring-unreviewed-count'] })
          onAlert?.(msg)
        }
      } catch {
        // non-JSON frame — ignore
      }
    }

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [qc, onAlert])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}
